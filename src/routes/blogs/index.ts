// src/routes/blogs/index.ts
import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../../services/supabaseClient';
import {
  authMiddleware,
  AuthenticatedRequest
} from '../../middlewares/authMiddleware';

const router = Router();

// GET /api/blogs
router.get(
  '/',
  authMiddleware,
  async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { data, error } = await supabaseAdmin
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }

      res.json(data);
    } catch {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/blogs
router.post(
  '/',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { title, content } = req.body;

    if (!title || !content) {
      res.status(400).json({ error: 'Title and content are required' });
      return;
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('blogs')
        .insert({ title, content, status: 'draft' })
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
