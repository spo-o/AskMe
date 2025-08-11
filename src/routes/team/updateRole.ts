import express, { Request, Response } from 'express';
import { supabaseAdmin } from '../../services/supabaseClient';

const router = express.Router();

router.put('/delete-role/:id', async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  const { error } = await supabaseAdmin
    .from('team_members')
    .update({ role })
    .eq('id', id);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(200).json({ message: 'Role updated' });
});

export default router;
