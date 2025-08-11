"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/blogs/index.ts
const express_1 = require("express");
const supabaseClient_1 = require("../../services/supabaseClient");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// GET /api/blogs
router.get('/', authMiddleware_1.authMiddleware, async (_req, res) => {
    try {
        const { data, error } = await supabaseClient_1.supabaseAdmin
            .from('blogs')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) {
            res.status(400).json({ error: error.message });
            return;
        }
        res.json(data);
    }
    catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/blogs
router.post('/', authMiddleware_1.authMiddleware, async (req, res) => {
    const { title, content } = req.body;
    if (!title || !content) {
        res.status(400).json({ error: 'Title and content are required' });
        return;
    }
    try {
        const { data, error } = await supabaseClient_1.supabaseAdmin
            .from('blogs')
            .insert({ title, content, status: 'draft' })
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
