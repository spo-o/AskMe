"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supabaseClient_1 = require("../../services/supabaseClient");
const router = express_1.default.Router();
router.post('/', async (req, res, next) => {
    const { first_name, last_name, email, phone, entity_type, company_name, experience_level, address, sqft, year_built, current_use, ownership_status, intended_use, timeline, help_level, description, selectedPackage, payment_status, } = req.body;
    const newProperty = {
        first_name,
        last_name,
        email,
        phone,
        entity_type,
        company_name,
        experience_level,
        address,
        sqft,
        year_built,
        current_use,
        ownership_status,
        intended_use,
        timeline,
        help_level,
        description,
        selected_package: selectedPackage,
        payment_status: 'pending'
    };
    const { data, error } = await supabaseClient_1.supabaseAdmin
        .from('custom_property_requests')
        .insert([newProperty])
        .select('id')
        .single();
    if (error) {
        console.error('[Supabase Insert Error]', error);
        res.status(500).json({ error: error.message });
    }
    if (!data) {
        res.status(500).json({ error: 'Failed to insert property' });
        return;
    }
    res.status(200).json({ id: data.id });
});
exports.default = router;
