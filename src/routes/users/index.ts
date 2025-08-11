// src/routes/users/index.ts
import { Router, Response } from 'express';
import { supabaseAdmin } from '../../services/supabaseClient';
import {
  authMiddleware,
  AuthenticatedRequest
} from '../../middlewares/authMiddleware';

const router = Router();

/**
 * GET /api/users
 * Returns all users from the profiles table.
 */
router.get(
  '/',
  authMiddleware,
  async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*');

      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }

      res.json(data);
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
