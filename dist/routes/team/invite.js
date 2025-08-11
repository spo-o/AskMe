"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supabaseClient_1 = require("../../services/supabaseClient");
const router = express_1.default.Router();
router.post('/', async (req, res) => {
    const { email, role } = req.body;
    const { nanoid } = await import("nanoid");
    const token = nanoid();
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const { error } = await supabaseClient_1.supabaseAdmin
        .from('invitations')
        .insert({ email, role, token, expires_at });
    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }
    res.status(200).json({ inviteUrl: `${req.headers.origin}/signup?token=${token}` });
});
exports.default = router;
