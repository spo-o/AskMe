import express, { Request, Response } from 'express';
import { supabaseAdmin } from '../../services/supabaseClient';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  const { email } = req.body;

  const { error } = await supabaseAdmin
    .from('team_members')
    .update({ status: 'active', accepted_at: new Date() })
    .eq('email', email);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(200).json({ message: 'Accepted' });
});

export default router;
