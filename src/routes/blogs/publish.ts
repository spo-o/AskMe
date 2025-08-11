// src/routes/blogs/publish.ts
import { Router, Response } from 'express';
import { supabaseAdmin } from '../../services/supabaseClient';
import { authMiddleware, AuthenticatedRequest } from '../../middlewares/authMiddleware';

const router = Router();

router.patch(
  '/:id/publish',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
      const { data, error } = await supabaseAdmin
        .from('blogs')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
        })
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
