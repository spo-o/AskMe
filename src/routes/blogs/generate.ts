// src/routes/blogs/generate.ts
import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../../middlewares/authMiddleware';

const router = Router();

/**
 * POST /api/blogs/generate
 * Simulates blog content generation based on title.
 */
router.post(
  '/',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { title } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Missing blog title' });
      return;
    }

    try {
      // Replace this with OpenAI or other logic later
      const simulatedContent = `## ${title}\n\nThis is an auto-generated blog post about **${title}**. Stay tuned for more details!`;

      res.status(200).json({ content: simulatedContent });
    } catch (err) {
      console.error('Error generating blog:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
