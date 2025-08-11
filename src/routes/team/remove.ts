import express, { Request, Response } from 'express';
import { supabaseAdmin } from '../../services/supabaseClient';

const router = express.Router();

router.delete('/delete/:id', async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from('team_members')
    .delete()
    .eq('id', id);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(200).json({ message: 'Removed' });
});

export default router;
