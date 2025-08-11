"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dotenv_1 = __importDefault(require("dotenv"));
const supabaseClient_1 = require("../../services/supabaseClient");
dotenv_1.default.config();
const router = (0, express_1.Router)();
router.get('/check-payment-status/:requestId', async (req, res) => {
    const { requestId } = req.params;
    if (!requestId) {
        res.status(400).json({ error: 'Request ID is required.' });
        return;
    }
    try {
        const { data, error } = await supabaseClient_1.supabaseAdmin
            .from('custom_property_requests')
            .select('payment_status')
            .eq('id', requestId)
            .single();
        if (error) {
            console.error('Supabase error checking payment status:', error);
            res.status(500).json({ error: 'Failed to retrieve payment status.' });
            return;
        }
        if (!data) {
            res.status(404).json({ error: 'Request with provided ID not found.' });
            return;
        }
        res.json({ paymentStatus: data.payment_status });
    }
    catch (err) {
        console.error('Server error checking payment status:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});
exports.default = router;
