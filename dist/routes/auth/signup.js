"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const supabaseClient_1 = require("../../services/supabaseClient");
const stripeClient_1 = require("../../services/stripeClient");
const router = express_1.default.Router();
const signupValidators = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Must be a valid email'),
    (0, express_validator_1.body)('password').isLength({ min: 8 }).withMessage('Password too short'),
    (0, express_validator_1.body)('profile.firstName').notEmpty().withMessage('First name required'),
    (0, express_validator_1.body)('profile.lastName').notEmpty().withMessage('Last name required'),
    (0, express_validator_1.body)('profile.phone').optional().isMobilePhone('any').withMessage('Invalid phone'),
    (0, express_validator_1.body)('profile.company').optional().isString(),
    (0, express_validator_1.body)('profile.role').optional().isString(),
    (0, express_validator_1.body)('plan')
        .isIn(['free', 'starter_monthly', 'starter_annual', 'pro_monthly', 'pro_annual'])
        .withMessage('Invalid subscription plan'),
];
router.post('/', ...signupValidators, async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { email, password, profile, plan } = req.body;
    console.debug('[DEBUG] Incoming signup request body:', JSON.stringify(req.body, null, 2));
    try {
        // Step 1: Create Supabase user
        const { data: createdUser, error: createErr } = await supabaseClient_1.supabaseAdmin.auth.admin.createUser({
            email,
            password,
            user_metadata: {
                full_name: `${profile.firstName} ${profile.lastName}`,
                phone: profile.phone,
                company: profile.company,
                role: profile.role,
            },
            email_confirm: true,
        });
        if (createErr) {
            console.error('Signup error:', createErr);
            res.status(400).json({ error: createErr.message });
            return;
        }
        // Step 2: Insert into users table
        const insertRes = await supabaseClient_1.supabaseAdmin.from('users').insert({
            id: createdUser.user.id,
            email: createdUser.user.email,
            first_name: profile.firstName,
            last_name: profile.lastName,
            plan,
        });
        if (insertRes.error) {
            console.error('Error inserting into users table:', insertRes.error);
            res.status(500).json({ error: 'Failed to store user details' });
            return;
        }
        // Step 3: Plan to Stripe Price ID map
        const priceMap = {
            starter_monthly: process.env.STARTER_MONTHLY_PRICE_ID,
            starter_annual: process.env.STARTER_ANNUAL_PRICE_ID,
            pro_monthly: process.env.PRO_MONTHLY_PRICE_ID,
            pro_annual: process.env.PRO_ANNUAL_PRICE_ID,
        };
        if (plan !== 'free') {
            const priceId = priceMap[plan];
            if (!priceId) {
                console.error(`[Stripe Error] No price ID found for plan: ${plan}`);
                res.status(500).json({ error: 'No Stripe price ID found for selected plan' });
                return;
            }
            try {
                const session = await stripeClient_1.stripe.checkout.sessions.create({
                    payment_method_types: ['card'],
                    mode: 'subscription',
                    line_items: [{ price: priceId, quantity: 1 }],
                    customer_email: createdUser.user.email,
                    success_url: `https://propvia.vercel.app/login?from=payment_success&session_id={CHECKOUT_SESSION_ID}`,
                    cancel_url: `https://propvia.vercel.app/pricing`,
                    metadata: {
                        userId: createdUser.user.id,
                        plan,
                    },
                });
                console.log('[Stripe] Session created:', session.id);
                res.status(200).json({ url: session.url });
                return;
            }
            catch (stripeErr) {
                console.error('[Stripe Error] Failed to create session:', stripeErr);
                res.status(500).json({ error: 'Failed to create Stripe session' });
                return;
            }
        }
        // Free plan → return created user directly
        res.status(201).json({
            user: {
                id: createdUser.user.id,
                email: createdUser.user.email,
                user_metadata: createdUser.user.user_metadata,
            },
        });
    }
    catch (err) {
        console.error('Unhandled signup error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
