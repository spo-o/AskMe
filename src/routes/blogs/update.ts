// src/routes/blogs/update.ts
import { Router, Response } from 'express';
import { supabaseAdmin } from '../../services/supabaseClient';
import { authMiddleware, AuthenticatedRequest } from '../../middlewares/authMiddleware';

const router = Router();

router.patch(
  '/update/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { title, content } = req.body;

    if (!title && !content) {
      res.status(400).json({ error: 'Nothing to update' });
      return;
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('blogs')
        .update({ title, content })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      res.json(data);
    } catch {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
