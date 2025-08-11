"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const postmark_1 = require("postmark");
const router = express_1.default.Router();
const postmarkClient = new postmark_1.Client(process.env.POSTMARK_API_KEY);
const validators = [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Name is required'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('subject').notEmpty().withMessage('Subject is required'),
    (0, express_validator_1.body)('message').notEmpty().withMessage('Message is required'),
];
router.post('/', validators, async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { name, email, subject, message } = req.body;
    try {
        await postmarkClient.sendEmail({
            From: 'hello@propvia.com',
            To: email, // ✅ user's own email (after approval)
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
    }
    catch (err) {
        console.error('Postmark sendEmail error:', err);
        res.status(500).json({ error: 'Failed to send confirmation email.' });
    }
});
exports.default = router;
