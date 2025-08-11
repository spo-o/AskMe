"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const supabaseClient_1 = require("../services/supabaseClient");
const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Authorization header missing or invalid' });
        return;
    }
    const token = authHeader.split(' ')[1];
    const { data, error } = await supabaseClient_1.supabase.auth.getUser(token);
    if (error || !data?.user) {
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
    }
    req.user = data.user;
    next();
};
exports.authMiddleware = authMiddleware;
