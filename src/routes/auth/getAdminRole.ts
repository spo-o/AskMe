// src/routes/auth/getAdminRole.ts
import { Router, Response } from 'express';
import { supabaseAdmin } from '../../services/supabaseClient';
import {
  authMiddleware,
  AuthenticatedRequest
} from '../../middlewares/authMiddleware';

const router = Router();

/**
 * GET /api/user/role
 * Returns the authenticated user's role from `team_members`.
 */
router.get(
  '/',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;

      const { data, error } = await supabaseAdmin
        .from('team_members')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        res.status(400).json({ error: error?.message ?? 'Role not found' });
        return;
      }

      res.json({ role: data.role });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
