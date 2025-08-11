"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/auth/getAdminRole.ts
const express_1 = require("express");
const supabaseClient_1 = require("../../services/supabaseClient");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const router = (0, express_1.Router)();
/**
 * GET /api/user/role
 * Returns the authenticated user's role from `team_members`.
 */
router.get('/', authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { data, error } = await supabaseClient_1.supabaseAdmin
            .from('team_members')
            .select('role')
            .eq('user_id', userId)
            .single();
        if (error || !data) {
            res.status(400).json({ error: error?.message ?? 'Role not found' });
            return;
        }
        res.json({ role: data.role });
    }
    catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
