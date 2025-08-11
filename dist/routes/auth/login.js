"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const supabaseClient_1 = require("../../services/supabaseClient");
const router = express_1.default.Router();
const loginValidators = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Must be a valid email'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
];
router.post('/', ...loginValidators, async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { email, password } = req.body;
    try {
        const { data, error } = await supabaseClient_1.supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error || !data.session) {
            console.error('Login failed:', error?.message || 'Unknown error');
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const user = data.user;
        const session = data.session;
        // ✅ Safely parse user_metadata using optional chaining & default object
        const metadata = typeof user.user_metadata === 'object' && user.user_metadata !== null
            ? user.user_metadata
            : {};
        const responseData = {
            user: {
                id: user.id,
                email: user.email,
                full_name: metadata.full_name ?? '',
                company: metadata.company ?? '',
                phone: metadata.phone ?? '',
                role: metadata.role ?? '',
            },
            session: {
                access_token: session.access_token,
                refresh_token: session.refresh_token,
                expires_in: session.expires_in,
            },
        };
        res.status(200).json(responseData);
    }
    catch (err) {
        console.error('Unhandled login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
