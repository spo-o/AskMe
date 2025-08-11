"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const openai_1 = __importDefault(require("openai"));
const dotenv_1 = __importDefault(require("dotenv"));
const supabaseClient_1 = require("../../services/supabaseClient");
dotenv_1.default.config();
const router = express_1.default.Router();
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
router.post('/', async (req, res, next) => {
    const { userId, prompt } = req.body;
    if (!userId || !prompt) {
        res.status(400).json({ error: 'Missing userId or prompt' });
        return;
    }
    try {
        console.log(' GPT ASK prompt:', prompt);
        // Step 1: Ask GPT to extract filters
        const gptResponse = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are a backend assistant that extracts structured filters from user prompts about commercial real estate in Detroit. Extract useful details like budget, location, purpose, and any preferences like walkability, foot traffic, or visibility. Output as JSON.',
                },
                {
                    role: 'user',
                    content: `Extract structured JSON filters from this user prompt: "${prompt}". Output format: {"budget": number, "location": string, "purpose": string, "preferences": string[]}`,
                },
            ],
        });
        const gptContent = gptResponse.choices[0]?.message?.content || '{}';
        console.log(' GPT structured output:', gptContent);
        const filters = JSON.parse(gptContent);
        const budget = filters.budget || 100000;
        const location = (filters.location || '').toLowerCase();
        const purpose = (filters.purpose || '').toLowerCase();
        const preferences = filters.preferences || [];
        // Step 2: Query Supabase enriched_properties table
        let { data, error } = await supabaseClient_1.supabaseAdmin
            .from('enriched_properties')
            .select('*')
            .lte('askingPrice', budget)
            .limit(100);
        if (error) {
            console.error(' Supabase error:', error);
            res.status(500).json({ error: 'Failed to fetch properties' });
            return;
        }
        // Step 3: Filter for location and optional keywords
        const filtered = (data || []).filter((p) => {
            const matchLocation = location ? p.address?.toLowerCase().includes(location) : true;
            const matchPurpose = purpose ? (p.description?.toLowerCase().includes(purpose) || p.tags?.includes(purpose)) : true;
            const matchPreferences = preferences.every((pref) => {
                return (p.description?.toLowerCase().includes(pref.toLowerCase()) ||
                    p.tags?.some((tag) => tag.toLowerCase().includes(pref.toLowerCase())));
            });
            return matchLocation && matchPurpose && matchPreferences;
        });
        // Step 4: Score properties
        const scored = filtered
            .map((p) => {
            const score = (p.roi ?? 0) * 0.5 +
                (p.market ?? 0) * 0.3 +
                (p.growth ?? 0) * 0.2;
            return { ...p, score };
        })
            .sort((a, b) => b.score - a.score)
            .slice(0, 3); // top 3
        // Step 5: Track usage after success
        const { error: usageError } = await supabaseClient_1.supabaseAdmin.rpc('increment_ask_count', {
            user_id_input: userId,
        });
        if (usageError) {
            console.warn('⚠️ Failed to increment ask usage:', usageError);
        }
        res.json(scored);
    }
    catch (err) {
        console.error(' GPT ASK error:', err);
        res.status(500).json({ error: 'Server error processing GPT ASK' });
    }
});
exports.default = router;
