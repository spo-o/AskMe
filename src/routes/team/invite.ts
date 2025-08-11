import express, { Request, Response } from 'express';
import { supabaseAdmin } from '../../services/supabaseClient';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  const { email, role } = req.body;
  const { nanoid } = await import("nanoid");
  const token = nanoid();
  const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const { error } = await supabaseAdmin
    .from('invitations')
    .insert({ email, role, token, expires_at });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(200).json({ inviteUrl: `${req.headers.origin}/signup?token=${token}` });
});

export default router;
