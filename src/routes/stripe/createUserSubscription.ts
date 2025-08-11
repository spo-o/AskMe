import express, { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { supabase } from '../../services/supabaseClient';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

// Stripe price IDs for subscription plans
const PRICE_IDS: Record<string, string> = {
  starter_monthly: process.env.STARTER_MONTHLY_PRICE_ID!,
  starter_yearly: process.env.STARTER_ANNUAL_PRICE_ID!,
  pro_monthly: process.env.PRO_MONTHLY_PRICE_ID!,
  pro_yearly: process.env.PRO_ANNUAL_PRICE_ID!,
};
//console.log('Loaded Stripe Price IDs:', PRICE_IDS);


router.post(
  '/create-subscription-session',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { userId, selectedPlan }: { userId: string; selectedPlan: keyof typeof PRICE_IDS } = req.body;
    console.log('[SUBSCRIPTION] Incoming plan:', selectedPlan);
    console.log('[SUBSCRIPTION] Available PRICE_IDS:', PRICE_IDS);
    console.log('[SUBSCRIPTION] Using price ID:', PRICE_IDS[selectedPlan]);

    console.log('[Stripe] /create-subscription-session called with:', req.body);

    if (!userId || !selectedPlan || !PRICE_IDS[selectedPlan]) {
      res.status(400).json({ error: 'Missing or invalid parameters' });
      return;
    }

    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('email, stripe_customer_id, first_name, last_name')
        .eq('id', userId)
        .single();

      if (error || !user) {
        console.error('❌ User fetch failed:', error?.message);
        res.status(404).json({ error: 'User not found' });
        return;
      }

      let customerId = user.stripe_customer_id;

      // Create new Stripe customer if not existing
      if (!customerId) {
        const customer = await stripe.customers.create({ email: user.email });
        customerId = customer.id;

        const { error: updateError } = await supabase
          .from('users')
          .update({ stripe_customer_id: customerId })
          .eq('id', userId);

        if (updateError) {
          console.warn('⚠️ Failed to store customer ID in Supabase:', updateError.message);
        }
      }
      // Before hitting your backend API to create a Stripe session
        console.log('🛒 Sending Stripe session with:');
        console.log({
          email: user.email,
          plan: selectedPlan,
        first_name: user.first_name,
        last_name: user.last_name,
      });


      // Create Stripe Checkout session
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: PRICE_IDS[selectedPlan],
            quantity: 1,
          },
        ],
        metadata: {
          user_id: userId,
          email: user.email,
          plan: selectedPlan,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
        },
        
        success_url: `${process.env.FRONTEND_URL}/subscription-success`,
        cancel_url: `${process.env.FRONTEND_URL}/subscription-cancelled`,
      });

      res.json({ url: session.url });
    } catch (err) {
      Object.entries(PRICE_IDS).forEach(([key, value]) => {
        if (!value) {
          console.error(`[ERROR] Missing price ID for ${key}`);
          throw new Error(`Missing Stripe price ID for ${key}`);
        }
      });
      
      console.error('❌ Error creating Stripe session:', err);
      next(err);
    }
  }
);

export default router;
