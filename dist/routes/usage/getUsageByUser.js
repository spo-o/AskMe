"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supabaseClient_1 = require("../../services/supabaseClient");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const router = express_1.default.Router();
// Hardcoded plan limits
const PLAN_LIMITS = {
    free: {
        analysis: 3,
        ask: 10,
    },
    pro: {
        analysis: 30,
        ask: 100,
    },
};
router.get('/user/:userId', async (req, res, next) => {
    const { userId } = req.params;
    console.log(' /by-user called for:', userId);
    try {
        // 1️ Query this user's usage for this month
        const now = new Date();
        const monthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
        console.log(' Month key for usage:', monthKey);
        const { data, error } = await supabaseClient_1.supabaseAdmin
            .from('usage_tracking')
            .select('*')
            .eq('user_id', userId)
            .eq('month', monthKey)
            .single();
        if (error && error.code !== 'PGRST116') {
            console.error(' Failed to fetch usage from Supabase:', error);
            res.status(500).json({ error: 'Database error' });
            return;
        }
        // 2️ Assume default zero usage if no record
        const usage = {
            analysis: data?.analysis_count ?? 0,
            ask: data?.ask_count ?? 0,
        };
        console.log(' Fetched usage:', usage);
        // 3️ For now, hardcode plan = free
        const plan = 'free';
        const limits = PLAN_LIMITS[plan];
        // 4️ Compute remaining
        const remaining = {
            analysis: limits.analysis - usage.analysis,
            ask: limits.ask - usage.ask,
        };
        console.log(' Remaining:', remaining);
        // 5 Return JSON
        res.json({
            plan,
            usage,
            limits,
            remaining,
        });
    }
    catch (err) {
        console.error(' Unexpected error in /by-user:', err);
        res.status(500).json({ error: 'Unexpected server error' });
    }
});
exports.default = router;
