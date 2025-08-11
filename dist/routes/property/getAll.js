"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supabaseClient_1 = require("../../services/supabaseClient");
const router = express_1.default.Router();
router.post('/', async (req, res) => {
    try {
        const { data, error } = await supabaseClient_1.supabaseAdmin
            .from('properties')
            .select('*');
        if (error || !data) {
            res.status(500).json({ error: error?.message || 'Data not found' });
            return;
        }
        const filtered = data.filter((p) => typeof p.latitude === 'number' && typeof p.longitude === 'number');
        res.status(200).json(filtered);
    }
    catch (err) {
        res.status(500).json({ error: 'Unexpected error occurred' });
    }
});
