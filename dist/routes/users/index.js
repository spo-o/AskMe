"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/users/index.ts
const express_1 = require("express");
const supabaseClient_1 = require("../../services/supabaseClient");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const router = (0, express_1.Router)();
/**
 * GET /api/users
 * Returns all users from the profiles table.
 */
router.get('/', authMiddleware_1.authMiddleware, async (_req, res) => {
    try {
        const { data, error } = await supabaseClient_1.supabaseAdmin
            .from('profiles')
            .select('*');
        if (error) {
            res.status(400).json({ error: error.message });
            return;
        }
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
