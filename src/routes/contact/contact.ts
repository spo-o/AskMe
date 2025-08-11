import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Client } from 'postmark';

const router = express.Router();
const postmarkClient = new Client(process.env.POSTMARK_API_KEY!);

const validators = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('message').notEmpty().withMessage('Message is required'),
];

router.post(
  '/',
  validators,
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { name, email, subject, message } = req.body;

    try {
      await postmarkClient.sendEmail({
        From: 'hello@propvia.com',   
        To: email,                     // ✅ user's own email (after approval)
        Subject: `Thanks for contacting Propvia`,
        HtmlBody: `pop
          <h3>Hi ${name},</h3>
          <p>Thanks for reaching out. We received your message:</p>
          <blockquote>${message.replace(/\n/g, '<br/>')}</blockquote>
          <p>We'll get back to you shortly.</p>
          <p>— The Propvia Team</p>
        `,
        TextBody: `Hi ${name},\n\nThanks for reaching out. We received your message:\n\n${message}\n\nWe'll get back to you shortly.\n\n— The Propvia Team`,
        ReplyTo: 'team@propvia.com',
      });

      res.status(200).json({ success: true });
    } catch (err) {
      console.error('Postmark sendEmail error:', err);
      res.status(500).json({ error: 'Failed to send confirmation email.' });
    }
  }
);

export default router;
