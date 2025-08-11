import express, { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../../services/supabaseClient';

const router = express.Router();

router.get('/user/:userEmail', async (req: Request, res: Response, next: NextFunction) => {
  const { userEmail } = req.params;

  if (!userEmail) {
    res.status(400).json({ error: 'Missing user email' });
    return;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('custom_property_requests')
      .select('*, reports:custom_request_reports(*)')
      .eq('email', userEmail);

    if (error) {
      console.error('Supabase query error:', error);
      res.status(500).json({ error: 'Failed to fetch user reports' });
      return;
    }

    res.json(data);
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Unexpected error' });
  }
});

export default router;
