"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supabaseClient_1 = require("../../services/supabaseClient");
//import { incrementUsage } from '../../utils/usage'; // optional, if usage tracking is centralized
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const router = express_1.default.Router();
router.post('/ask', async (req, res, next) => {
    const { userId, prompt } = req.body;
    if (!userId || !prompt) {
        res.status(400).json({ error: 'Missing userId or prompt' });
        return;
    }
    try {
        console.log('🧠 ASK received prompt:', prompt);
        // Step 1: Very basic mock keyword extraction
        const budgetMatch = prompt.match(/\$?(\d{2,5})k/i);
        const budget = budgetMatch?.[1] ? parseInt(budgetMatch[1]) * 1000 : 100000; // 100k fallback
        const location = prompt.toLowerCase().includes('north') ? 'north' : '';
        console.log(`🔍 Budget parsed: ${budget} | Location keyword: ${location}`);
        // Step 2: Query enriched_properties with filters
        let query = supabaseClient_1.supabaseAdmin
            .from('enriched_properties')
            .select('*')
            .lte('askingPrice', budget)
            .limit(100); // Limit base results before scoring
        const { data, error } = await query;
        if (error) {
            console.error('❌ Error fetching properties:', error);
            res.status(500).json({ error: 'Failed to fetch properties' });
            return;
        }
        // Step 3: Score based on ROI + Market + Growth
        const scored = (data || [])
            .filter((p) => location
            ? p.address?.toLowerCase().includes('north') ||
                (p.latitude && p.latitude > 42.35) // example for Detroit "north"
            : true)
            .map((p) => {
            const score = (p.roi ?? 1) * 0.5 + (p.market ?? 1) * 0.3 + (p.growth ?? 1) * 0.2;
            return { ...p, score };
        })
            .sort((a, b) => b.score - a.score)
            .slice(0, 1);
        // Step 4: Increment ASK usage
        try {
            await fetch(`${process.env.API_BASE_URL}/usage/increment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, type: 'ask' }),
            });
        }
        catch (error) {
            //console.warn('⚠️ Failed to increment usage:', (error as Error).message);
        }
        res.json(scored);
    }
    catch (err) {
        console.error('❌ ASK route error:', err);
        res.status(500).json({ error: 'Server error while processing ASK' });
    }
});
exports.default = router;
