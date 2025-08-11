"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const stripe_1 = __importDefault(require("stripe"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
const router = express_1.default.Router();
// Add this
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'https://propvia-be.onrender.com';
router.post('/', async (req, res, _next) => {
    const { packageTier, customerEmail, ...formData } = req.body;
    const { propertyRequestId } = req.body;
    const priceMap = {
        basic: process.env.PRICE_BASIC,
        standard: process.env.PRICE_STANDARD,
        premium: process.env.PRICE_PREMIUM,
    };
    const validTiers = ['basic', 'standard', 'premium'];
    const priceId = priceMap[packageTier];
    if (!validTiers.includes(packageTier) || !priceId) {
        res.status(400).json({ error: 'Invalid package tier' });
        return;
    }
    console.log(' Received propertyRequestId:', propertyRequestId);
    console.log(' Checkout body received:', req.body);
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [{ price: priceId, quantity: 1 }],
            customer_email: customerEmail,
            // ← use your deployed origin
            success_url: `${FRONTEND_ORIGIN}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${FRONTEND_ORIGIN}/cancel`,
            metadata: {
                propertyRequestId: String(propertyRequestId),
            },
        });
        try {
            const fullFormData = {
                ...formData.formData,
                selectedPackage: packageTier,
            };
            // await sendConfirmationEmail(customerEmail, fullFormData);
        }
        catch (emailErr) {
            console.warn('Email sending failed:', emailErr);
        }
        res.json({ url: session.url });
    }
    catch (err) {
        console.error('Stripe error:', err);
        res.status(500).json({ error: 'Failed to create Stripe session' });
    }
});
exports.default = router;
