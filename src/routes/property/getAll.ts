import express, { Request, Response } from 'express';
import { supabaseAdmin } from '../../services/supabaseClient';

const router = express.Router();

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('properties')
      .select('*');

    if (error || !data) {
      res.status(500).json({ error: error?.message || 'Data not found' });
      return;
    }

    const filtered = data.filter(
      (p) => typeof p.latitude === 'number' && typeof p.longitude === 'number'
    );

    res.status(200).json(filtered);
  } catch (err: any) {
    res.status(500).json({ error: 'Unexpected error occurred' });
  }
});
