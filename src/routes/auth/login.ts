import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { supabase } from '../../services/supabaseClient';

const router = express.Router();

const loginValidators = [
  body('email').isEmail().withMessage('Must be a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post(
  '/',
  ...loginValidators,
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password } = req.body;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.session) {
        console.error('Login failed:', error?.message || 'Unknown error');
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const user = data.user;
      const session = data.session;

      // ✅ Safely parse user_metadata using optional chaining & default object
      const metadata = typeof user.user_metadata === 'object' && user.user_metadata !== null
        ? user.user_metadata
        : {};

      const responseData = {
        user: {
          id: user.id,
          email: user.email,
          full_name: metadata.full_name ?? '',
          company: metadata.company ?? '',
          phone: metadata.phone ?? '',
          role: metadata.role ?? '',
        },
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_in: session.expires_in,
        },
      };

      res.status(200).json(responseData);
    } catch (err: any) {
      console.error('Unhandled login error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
