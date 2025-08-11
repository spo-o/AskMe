import express, { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { supabase } from '../../services/supabaseClient';

const router = express.Router();

const TABLE_NAME = 'liveproperties';

// Utility to chunk an array into batches
function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

/**
 * GET /api/property/live
 * - Directly hits RapidAPI Lease v2 / SearchByAddress
 * - Requires country + at least one of city/state/county/zipCode
 */
router.get('/live', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { country, state, city, county, zipCode, page } = req.query;

    if (!country) {
      res.status(400).json({ error: 'country is required' });
      return;
    }

    if (!state && !city && !county && !zipCode) {
      res.status(400).json({
        error: 'At least one of state, city, county, or zipCode must be provided'
      });
      return;
    }

    const payload = {
      country,
      state: state ?? null,
      city: city ?? null,
      county: county ?? null,
      zipCode: zipCode ?? null,
      page: page ? parseInt(page as string, 10) : 1,
    };

    console.log("Using API key:", process.env.RAPIDAPI_KEY);
    console.log("➡️ Sending payload to LoopNet:", payload);

    const searchResponse = await axios.post(
      'https://loopnet-api.p.rapidapi.com/loopnet/v2/lease/searchByAddress',
      payload,
      {
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY!,
          'X-RapidAPI-Host': 'loopnet-api.p.rapidapi.com',
          'Content-Type': 'application/json',
        },
      }
    );

    const listings = searchResponse.data?.data?.[0]?.listings || [];
    console.log(` Found ${listings.length} listings in search`);

    if (listings.length === 0) {
      res.json([]);
      return;
    }

    const idToLatLng: Record<string, { latitude: number | null; longitude: number | null }> = {};
    listings.forEach((item: any) => {
      idToLatLng[item.listingID?.toString()] = {
        latitude: item.latitude ?? null,
        longitude: item.longitude ?? null,
      };
    });

    const listingIds = listings
      .map((item: any) => item.listingID?.toString())
      .filter((id: any) => id != null);

    console.log(" All Listing IDs:", listingIds);

    const batches = chunkArray(listingIds, 20);
    let allDetails: any[] = [];

    for (const batch of batches) {
      console.log("➡️ Fetching bulkDetails for batch:", batch);
      const bulkDetailsResponse = await axios.post(
        'https://loopnet-api.p.rapidapi.com/loopnet/property/bulkDetails',
        { listingIds: batch },
        {
          headers: {
            'X-RapidAPI-Key': process.env.RAPIDAPI_KEY!,
            'X-RapidAPI-Host': 'loopnet-api.p.rapidapi.com',
            'Content-Type': 'application/json',
          },
        }
      );

      const details = bulkDetailsResponse.data?.data || [];
      allDetails = allDetails.concat(details);
      console.log(` Batch fetched ${details.length} detail(s)`);
    }

    const simplified = allDetails.map((item: any) => {
      const id = item.listingId?.toString();
      const sqftMatch = item.location?.availableSpace?.match(/([\d,]+)/);
      const parsedSqft = sqftMatch ? parseInt(sqftMatch[1].replace(/,/g, '')) : 0;
      const latlng = idToLatLng[id];

      return {
        id,
        address: item.location?.address || 'Unknown Address',
        sqft: parsedSqft,
        latitude: latlng?.latitude ?? null,
        longitude: latlng?.longitude ?? null,
        price: typeof item.price === 'string' && item.price.startsWith('$')
          ? parseFloat(item.price.replace(/[^0-9.]/g, ''))
          : 0,
        zoning: item.listingType || 'unknown',
        image: item.photo || null,
      };
    });

    res.json(simplified);
  } catch (err: any) {
    console.error('LoopNet API error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch live properties' });
  }
});

/**
 * POST /api/property/populate
 * - Fetches all pages of live data from /live
 * - Stores all in Supabase
 */
router.post('/populate', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log(" Starting LoopNet data fetch for Detroit with pagination...");

    const maxPages = 50;
    const seenIds = new Set();
    let allListings: any[] = [];

    let page = 1;
    while (page <= maxPages) {
      console.log(`➡️ Fetching page ${page}...`);

      const params = new URLSearchParams({
        country: 'US',
        state: 'MI',
        city: 'Detroit',
        page: page.toString(),
      });

      const liveResponse = await axios.get(
        `${process.env.API_BASE_URL}/api/property/live?${params.toString()}`
      );
      

      const listings = liveResponse.data;
      console.log(` Page ${page}: Fetched ${listings.length} listings`);

      if (!listings.length) break;

      let newCount = 0;
      let duplicateCount = 0;

      const newListings = listings.filter((item: any) => {
        if (seenIds.has(item.id)) {
          duplicateCount++;
          return false;
        }
        seenIds.add(item.id);
        newCount++;
        return true;
      });

      console.log(` Page ${page}: ${newCount} new, ${duplicateCount} duplicate`);

      if (!newListings.length) {
        console.log(' No new listings found. Ending pagination.');
        break;
      }

      allListings = allListings.concat(newListings);
      page++;
    }

    if (!allListings.length) {
      console.warn('⚠️ No listings found from LoopNet.');
      res.status(400).json({ error: 'No listings found from live fetch' });
      return;
    }

    console.log(` Total listings to save: ${allListings.length}`);
    console.log(' Example listing:', JSON.stringify(allListings[0], null, 2));

    const enrichedListings = allListings.map((item: any) => ({
      id: item.id,
      address: item.address,
      sqft: item.sqft,
      latitude: item.latitude,
      longitude: item.longitude,
      price: item.price,
      zoning: item.zoning,
      image: item.image,
      last_fetched_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from(TABLE_NAME)
      .upsert(enrichedListings, { onConflict: 'id' });

    if (error) {
      console.error(' SUPABASE UPSERT ERROR:', JSON.stringify(error, null, 2));
      res.status(500).json({ error: 'Failed to save properties to DB', details: error });
      return;
    }

    console.log(` Successfully upserted ${enrichedListings.length} records.`);
    res.json({ message: `Stored ${enrichedListings.length} properties to DB` });

  } catch (err: any) {
    console.error(' Populate error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to populate properties' });
  }
});


/**
 * GET /api/property
 * - Serves stored properties with pagination
 * - Supports filtering and sorting
 */
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { city, zoning, minPrice, maxPrice, sortBy, sortOrder } = req.query;

    let query = supabase
      .from(TABLE_NAME)
      .select('*', { count: 'exact' });

    // Filters
    if (city) query = query.ilike('address', `%${city}%`);
    if (zoning) query = query.eq('zoning', zoning);
    if (minPrice) query = query.gte('price', Number(minPrice));
    if (maxPrice) query = query.lte('price', Number(maxPrice));

    // Sorting
    const validSortFields = ['price', 'sqft', 'last_fetched_at'];
    if (sortBy && validSortFields.includes(sortBy as string)) {
      query = query.order(sortBy as string, {
        ascending: (sortOrder === 'asc')
      });
    } else {
      query = query.order('last_fetched_at', { ascending: false });
    }

    // Pagination
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error(' Supabase fetch error:', JSON.stringify(error, null, 2));
      res.status(500).json({ error: 'Failed to fetch properties' });
      return;
    }

    

    res.json({
      data,
      pagination: {
        page,
        pageSize,
        total: count,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (err: any) {
    console.error(' Error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
