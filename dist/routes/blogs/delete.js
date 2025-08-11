"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/blogs/delete.ts
const express_1 = require("express");
const supabaseClient_1 = require("../../services/supabaseClient");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.delete('/delete/:id', authMiddleware_1.authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabaseClient_1.supabaseAdmin.from('blogs').delete().eq('id', id);
        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }
        res.status(204).send(); // No Content
    }
    catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
