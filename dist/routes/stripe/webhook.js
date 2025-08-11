"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const stripe_1 = __importDefault(require("stripe"));
const dotenv_1 = __importDefault(require("dotenv"));
const supabaseClient_1 = require("../../services/supabaseClient");
const emailSender_1 = require("../../utils/emailSender");
const pdfGenerator_1 = require("../../utils/pdfGenerator");
dotenv_1.default.config();
const router = express_1.default.Router();
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-05-28.basil',
});
// Plan quota logic
function getPlanQuota(plan) {
    switch (plan) {
        case 'starter_monthly':
        case 'starter_annual':
            return { ask_count: 4, analysis_count: 10, scenario_count: 5 };
        case 'pro_monthly':
        case 'pro_annual':
            return { ask_count: 9999, analysis_count: 9999, scenario_count: 10 };
        case 'visionary':
            return { ask_count: 9999, analysis_count: 9999, scenario_count: 9999 };
        default:
            return { ask_count: 0, analysis_count: 0, scenario_count: 0 };
    }
}
router.post('/', express_1.default.raw({ type: 'application/json' }), async (req, res, next) => {
    const sig = req.headers['stripe-signature'];
    const REPORT_BUCKET = 'custom-requests-reports';
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    }
    catch (err) {
        console.error('⚠️ Stripe webhook signature verification failed.', err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }
    //console.log('📩 Stripe event received:', event.type);
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        console.log('✅ [Webhook] checkout.session.completed triggered');
        console.log('📦 session.mode:', session.mode);
        console.log('📦 session.metadata:', session.metadata);
        console.log('📦 session.customer:', session.customer);
        console.log('📦 session.subscription:', session.subscription);
        console.log('📦 session.payment_method_types:', session.payment_method_types);
        // 👉 Custom Report Flow
        const propertyRequestId = session.metadata?.propertyRequestId;
        if (propertyRequestId) {
            console.log('🧾 Payment confirmed for custom propertyRequestId:', propertyRequestId);
            try {
                const { data, error: fetchError } = await supabaseClient_1.supabaseAdmin
                    .from('custom_property_requests')
                    .select('*')
                    .eq('id', propertyRequestId)
                    .single();
                if (fetchError || !data) {
                    console.error('❌ Failed to fetch request:', fetchError);
                    res.json({ received: true });
                    return;
                }
                if (data.payment_status === 'paid') {
                    console.log('⚠️ Already marked as paid. Skipping update.');
                    res.json({ received: true });
                    return;
                }
                const { error: updateError } = await supabaseClient_1.supabaseAdmin
                    .from('custom_property_requests')
                    .update({
                    payment_status: 'paid',
                    paid_at: new Date().toISOString(),
                })
                    .eq('id', propertyRequestId);
                if (updateError) {
                    console.error('❌ Failed to update payment_status:', updateError);
                }
                else {
                    console.log('✅ payment_status updated to "paid".');
                }
                try {
                    await (0, emailSender_1.sendConfirmationEmail)(data.email, data);
                    console.log('📧 Confirmation email sent!');
                }
                catch (emailErr) {
                    console.error('❌ Email send failed:', emailErr);
                }
                console.log('📄 Generating PDF...');
                const pdfBuffer = await (0, pdfGenerator_1.generatePdf)(data);
                const pdfFileName = `${propertyRequestId}.pdf`;
                const { error: uploadError } = await supabaseClient_1.supabaseAdmin.storage
                    .from(REPORT_BUCKET)
                    .upload(pdfFileName, pdfBuffer, {
                    contentType: 'application/pdf',
                    upsert: true,
                });
                if (uploadError) {
                    console.error('❌ Failed to upload PDF:', uploadError);
                }
                else {
                    console.log('✅ PDF uploaded to storage.');
                }
                console.log('session.mode', session.mode);
                const { data: publicUrlData } = supabaseClient_1.supabaseAdmin.storage
                    .from(REPORT_BUCKET)
                    .getPublicUrl(pdfFileName);
                const publicUrl = publicUrlData?.publicUrl;
                if (publicUrl) {
                    const { error: insertError } = await supabaseClient_1.supabaseAdmin
                        .from('custom_request_reports')
                        .insert([
                        {
                            property_request_id: propertyRequestId,
                            report_url: publicUrl,
                            created_at: new Date().toISOString(),
                        },
                    ]);
                    if (insertError) {
                        console.error(' Failed to insert report record:', insertError);
                    }
                    else {
                        console.log(' Report record saved.');
                    }
                }
            }
            catch (err) {
                console.error(' Unexpected error in custom request flow:', err);
            }
        }
        // 👉 Subscription Signup Flow
        if (session.mode === 'subscription' && session.metadata?.plan && session.metadata?.userId) {
            const selectedPlan = session.metadata.plan;
            const userEmail = session.metadata.email;
            console.log(`📦 Subscription confirmed: ${selectedPlan} for ${userEmail}`);
            const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);
            const interval = stripeSubscription.items.data[0]?.price?.recurring?.interval;
            const planStartedAt = new Date();
            let planExpiresAt = new Date(planStartedAt);
            if (interval === 'month') {
                planExpiresAt.setMonth(planExpiresAt.getMonth() + 1);
            }
            else if (interval === 'year') {
                planExpiresAt.setFullYear(planExpiresAt.getFullYear() + 1);
            }
            const { ask_count, analysis_count, scenario_count } = getPlanQuota(selectedPlan);
            const updatePayload = {
                plan: selectedPlan,
                subscription_active: true,
                stripe_subscription_id: session.subscription,
                stripe_customer_id: session.customer,
                subscription_status: 'active',
                payment_type: session.payment_method_types?.[0] || 'card',
                plan_started_at: planStartedAt.toISOString(),
                plan_expires_at: planExpiresAt.toISOString(),
                ask_count,
                analysis_count,
                scenario_count,
                updated_at: new Date().toISOString(),
            };
            if (session.metadata?.first_name)
                updatePayload['first_name'] = session.metadata.first_name;
            if (session.metadata?.last_name)
                updatePayload['last_name'] = session.metadata.last_name;
            const { error } = await supabaseClient_1.supabaseAdmin
                .from('users')
                .update(updatePayload)
                .eq('id', session.metadata.userId);
            if (error) {
                console.error('❌ Failed to activate subscription:', error.message);
            }
            else {
                console.log('✅ Subscription, quotas, and expiration updated.');
            }
        }
    }
    // 🔁 Renewal Webhook — Reset Usage Quotas on Renewal
    if (event.type === 'invoice.payment_succeeded') {
        const invoice = event.data.object;
        if (invoice.billing_reason === 'subscription_cycle') {
            const subscriptionId = invoice.subscription;
            console.log(`🔁 Renewal payment succeeded for ${subscriptionId}`);
            const { data: user, error } = await supabaseClient_1.supabaseAdmin
                .from('users')
                .select('email, plan')
                .eq('stripe_subscription_id', subscriptionId)
                .single();
            if (error || !user) {
                console.error('❌ User lookup failed for renewal:', error?.message);
                return;
            }
            const { email, plan } = user;
            const { ask_count, analysis_count, scenario_count } = getPlanQuota(plan);
            const { error: updateError } = await supabaseClient_1.supabaseAdmin
                .from('users')
                .update({
                ask_count,
                analysis_count,
                scenario_count,
                updated_at: new Date().toISOString(),
            })
                .eq('email', email);
            if (updateError) {
                console.error('❌ Quota reset failed:', updateError.message);
            }
            else {
                console.log(`✅ Quotas reset for ${plan} (${email})`);
            }
        }
    }
    res.json({ received: true });
});
exports.default = router;
