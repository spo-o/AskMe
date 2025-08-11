"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supabaseClient_1 = require("../../services/supabaseClient");
const router = express_1.default.Router();
router.get('/user/:userEmail', async (req, res, next) => {
    const { userEmail } = req.params;
    if (!userEmail) {
        res.status(400).json({ error: 'Missing user email' });
        return;
    }
    try {
        const { data, error } = await supabaseClient_1.supabaseAdmin
            .from('custom_property_requests')
            .select('*, reports:custom_request_reports(*)')
            .eq('email', userEmail);
        if (error) {
            console.error('Supabase query error:', error);
            res.status(500).json({ error: 'Failed to fetch user reports' });
            return;
        }
        res.json(data);
    }
    catch (err) {
        console.error('Unexpected error:', err);
        res.status(500).json({ error: 'Unexpected error' });
    }
});
exports.default = router;
