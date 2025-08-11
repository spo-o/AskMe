"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supabaseClient_1 = require("../../services/supabaseClient");
const router = express_1.default.Router();
router.post('/', async (req, res) => {
    const { email } = req.body;
    const { error } = await supabaseClient_1.supabaseAdmin
        .from('team_members')
        .update({ status: 'active', accepted_at: new Date() })
        .eq('email', email);
    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }
    res.status(200).json({ message: 'Accepted' });
});
exports.default = router;
