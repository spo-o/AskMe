import { Request, Response, Router } from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const router = Router();

router.get('/get-session-details/:sessionId', async (req: Request, res: Response): Promise<void> => {
    const { sessionId } = req.params;

    if (!sessionId) {
        res.status(400).json({ error: 'Session ID is required.' });
        return
    }

    try {
        // retrieve the Stripe Checkout Session
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        // extract the propertyRequestId from metadata
        const propertyRequestId = session.metadata ? session.metadata.propertyRequestId : null;

        if (!propertyRequestId) {
            res.status(404).json({ error: 'Property Request ID not found in session metadata for this session.' });
            return
        }

        res.json({ propertyRequestId: propertyRequestId });

    } catch (error: any) {
        console.error('Error retrieving Stripe session:', error);
        if (error.type === 'StripeInvalidRequestError') {
            res.status(400).json({ error: 'Invalid Stripe Session ID or session not found.' });
            return
        }
        res.status(500).json({ error: 'Internal server error while fetching session details.' });
    }
});

export default router;