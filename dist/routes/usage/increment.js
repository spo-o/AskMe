"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supabaseClient_1 = require("../../services/supabaseClient");
const router = express_1.default.Router();
router.post('/', async (req, res, next) => {
    const { userId, type, plan } = req.body;
    if (!userId || !type || !plan) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }
    // Define plan limits (easy to edit later)
    const planLimits = {
        basic: { analysis: 3, ask: 5 },
        standard: { analysis: 10, ask: 20 },
        premium: { analysis: 25, ask: 50 },
    };
    const limits = planLimits[plan];
    if (!limits) {
        res.status(400).json({ error: 'Invalid plan specified' });
        return;
    }
    const now = new Date();
    const monthKey = `${now.getUTCFullYear()}-${(now.getUTCMonth() + 1).toString().padStart(2, '0')}`;
    // Fetch existing usage record
    const { data: existing, error: fetchError } = await supabaseClient_1.supabaseAdmin
        .from('usage_tracking')
        .select('*')
        .eq('user_id', userId)
        .eq('month', monthKey)
        .single();
    if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Fetch error:', fetchError);
        res.status(500).json({ error: 'Database error' });
        return;
    }
    let analysesUsed = existing?.analyses_used ?? 0;
    let asksUsed = existing?.asks_used ?? 0;
    // Check if user is over limit
    if (type === 'analysis' && analysesUsed >= limits.analysis) {
        res.status(403).json({ error: 'Analysis limit reached for this month' });
        return;
    }
    if (type === 'ask' && asksUsed >= limits.ask) {
        res.status(403).json({ error: 'Ask limit reached for this month' });
        return;
    }
    // Increment usage
    let updates = {};
    if (type === 'analysis') {
        updates = { analyses_used: analysesUsed + 1 };
    }
    else if (type === 'ask') {
        updates = { asks_used: asksUsed + 1 };
    }
    else {
        res.status(400).json({ error: 'Invalid type' });
        return;
    }
    if (existing) {
        // Update row
        const { error: updateError } = await supabaseClient_1.supabaseAdmin
            .from('usage_tracking')
            .update(updates)
            .eq('id', existing.id);
        if (updateError) {
            console.error('Update error:', updateError);
            res.status(500).json({ error: 'Failed to update usage' });
            return;
        }
    }
    else {
        // Insert new row
        const insertData = {
            user_id: userId,
            month: monthKey,
            plan,
            analyses_used: type === 'analysis' ? 1 : 0,
            asks_used: type === 'ask' ? 1 : 0,
        };
        const { error: insertError } = await supabaseClient_1.supabaseAdmin
            .from('usage_tracking')
            .insert([insertData]);
        if (insertError) {
            console.error('Insert error:', insertError);
            res.status(500).json({ error: 'Failed to insert usage' });
            return;
        }
    }
    res.json({ success: true });
});
exports.default = router;
