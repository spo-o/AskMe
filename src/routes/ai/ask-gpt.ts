import express, { Request, Response, NextFunction } from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { supabaseAdmin } from '../../services/supabaseClient';

dotenv.config();

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { userId, prompt } = req.body;

  if (!userId || !prompt) {
    res.status(400).json({ error: 'Missing userId or prompt' });
    return;
  }

  try {
    console.log(' GPT ASK prompt:', prompt);

    // Step 1: Ask GPT to extract filters (e.g., budget, purpose, location)
    const gptResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a backend assistant that extracts structured filters from user prompts about commercial real estate in Detroit.',
        },
        {
          role: 'user',
          content: `Extract structured JSON filters from this user prompt: "${prompt}". Output format: {"budget": number, "location": string, "purpose": string}`,
        },
      ],
    });

    const gptContent = gptResponse.choices[0]?.message?.content || '{}';
    console.log(' GPT structured output:', gptContent);

    const filters = JSON.parse(gptContent);
    const budget = filters.budget || 100000;
    const location = (filters.location || '').toLowerCase();
    const purpose = (filters.purpose || '').toLowerCase();

    // Step 2: Query Supabase enriched_properties table
    let { data, error } = await supabaseAdmin
      .from('enriched_properties')
      .select('*')
      .lte('askingPrice', budget)
      .limit(100);

    if (error) {
      console.error(' Supabase error:', error);
      res.status(500).json({ error: 'Failed to fetch properties' });
      return;
    }

    // Step 3: Filter for location keyword (basic check)
    const filtered = (data || []).filter((p) =>
      location ? p.address?.toLowerCase().includes(location) : true
    );

    // Step 4: Score based on available fields (fallback logic)
    const scored = filtered
      .map((p) => {
        const score =
          (p.roi ?? 0) * 0.5 + (p.market ?? 0) * 0.3 + (p.growth ?? 0) * 0.2;
        return { ...p, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 1); //  Only top 1 for now

    res.json(scored);
  } catch (err) {
    console.error(' GPT ASK error:', err);
    res.status(500).json({ error: 'Server error processing GPT ASK' });
  }
});

export default router;
