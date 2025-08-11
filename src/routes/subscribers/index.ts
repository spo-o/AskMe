// src/routes/subscribers/index.ts
import { Router, Response } from 'express';
import { supabaseAdmin } from '../../services/supabaseClient';
import {
  authMiddleware,
  AuthenticatedRequest
} from '../../middlewares/authMiddleware';

const router = Router();

/**
 * GET /api/subscribers
 * Fetches all newsletter subscribers.
 */
router.get(
  '/',
  authMiddleware,
  async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('newsletter_subscribed', true);

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
