"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/blogs/update.ts
const express_1 = require("express");
const supabaseClient_1 = require("../../services/supabaseClient");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.patch('/update/:id', authMiddleware_1.authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    if (!title && !content) {
        res.status(400).json({ error: 'Nothing to update' });
        return;
    }
    try {
        const { data, error } = await supabaseClient_1.supabaseAdmin
            .from('blogs')
            .update({ title, content })
            .eq('id', id)
            .select()
            .single();
        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }
        res.json(data);
    }
    catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
