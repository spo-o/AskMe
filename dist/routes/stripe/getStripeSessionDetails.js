"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stripe_1 = __importDefault(require("stripe"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
const router = (0, express_1.Router)();
router.get('/get-session-details/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    if (!sessionId) {
        res.status(400).json({ error: 'Session ID is required.' });
        return;
    }
    try {
        // retrieve the Stripe Checkout Session
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        // extract the propertyRequestId from metadata
        const propertyRequestId = session.metadata ? session.metadata.propertyRequestId : null;
        if (!propertyRequestId) {
            res.status(404).json({ error: 'Property Request ID not found in session metadata for this session.' });
            return;
        }
        res.json({ propertyRequestId: propertyRequestId });
    }
    catch (error) {
        console.error('Error retrieving Stripe session:', error);
        if (error.type === 'StripeInvalidRequestError') {
            res.status(400).json({ error: 'Invalid Stripe Session ID or session not found.' });
            return;
        }
        res.status(500).json({ error: 'Internal server error while fetching session details.' });
    }
});
exports.default = router;
