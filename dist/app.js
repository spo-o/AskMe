"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const signup_1 = __importDefault(require("./routes/auth/signup"));
const login_1 = __importDefault(require("./routes/auth/login"));
const getAdminRole_1 = __importDefault(require("./routes/auth/getAdminRole"));
const index_1 = __importDefault(require("./routes/subscribers/index"));
const index_2 = __importDefault(require("./routes/users/index"));
const index_3 = __importDefault(require("./routes/newsletters/index"));
const index_4 = __importDefault(require("./routes/blogs/index"));
const generate_1 = __importDefault(require("./routes/blogs/generate"));
const publish_1 = __importDefault(require("./routes/blogs/publish"));
const delete_1 = __importDefault(require("./routes/blogs/delete"));
const update_1 = __importDefault(require("./routes/blogs/update"));
const invite_1 = __importDefault(require("./routes/team/invite"));
const accept_1 = __importDefault(require("./routes/team/accept"));
const remove_1 = __importDefault(require("./routes/team/remove"));
const updateRole_1 = __importDefault(require("./routes/team/updateRole"));
const saveProperty_1 = __importDefault(require("./routes/property/saveProperty"));
const createCheckoutSession_1 = __importDefault(require("./routes/stripe/createCheckoutSession"));
const loopnet_1 = __importDefault(require("./routes/property/loopnet"));
const webhook_1 = __importDefault(require("./routes/stripe/webhook"));
const getStripeSessionDetails_1 = __importDefault(require("./routes/stripe/getStripeSessionDetails"));
const checkPaymentStatus_1 = __importDefault(require("./routes/stripe/checkPaymentStatus"));
const getByUser_1 = __importDefault(require("./routes/reports/getByUser"));
const increment_1 = __importDefault(require("./routes/usage/increment"));
const createUserSubscription_1 = __importDefault(require("./routes/stripe/createUserSubscription"));
const getUsageByUser_1 = __importDefault(require("./routes/usage/getUsageByUser"));
const ask_ai_1 = __importDefault(require("./routes/ai/ask_ai"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
//  Stripe webhook needs raw body
app.use('/api/stripe/webhook', webhook_1.default);
app.use((req, res, next) => {
    console.log("Request received for Render BE:", req.method, req.url);
    next();
});
// All other routes can use JSON body parser
app.use(express_1.default.json());
// Auth
app.use('/api/auth/signup', signup_1.default);
app.use('/api/auth/login', login_1.default);
// AdminPortal APIs
app.use('/api/user/role', getAdminRole_1.default);
app.use('/api/subscribers', index_1.default);
app.use('/api/users', index_2.default);
app.use('/api/newsletters', index_3.default);
app.use('/api/blogs', index_4.default);
app.use('/api/blogs/generate', generate_1.default);
app.use('/api/blogs', publish_1.default);
app.use('/api/blogs', delete_1.default);
app.use('/api/blogs', update_1.default);
// CustomProperty analysis API
app.use('/api/property/saveProperty', saveProperty_1.default);
app.use('/api/reports/by-user', getByUser_1.default);
// Header
const contact_1 = __importDefault(require("./routes/contact/contact"));
app.use('/api/contact', contact_1.default);
// Team routes
app.use('/api/team/invite', invite_1.default);
app.use('/api/team/accept', accept_1.default);
app.use('/api/team/remove', remove_1.default);
app.use('/api/team/updateRole', updateRole_1.default);
// Stripe checkout for custom property analysis
app.use('/api/checkout', createCheckoutSession_1.default);
app.use('/api/stripe', getStripeSessionDetails_1.default);
app.use('/api/stripe', checkPaymentStatus_1.default);
//Stripe for user subscription
app.use('/api/stripe/create-subscription-session', createUserSubscription_1.default);
// live geo data
app.use('/api/property', loopnet_1.default);
//usage reports
app.use('/api/usage/increment', increment_1.default);
app.use('/api/usage/by-user', getUsageByUser_1.default);
//ASK
app.use('/api/ask_ai', ask_ai_1.default);
// ---- Serve built frontend (CommonJS-safe) ----
const clientDist = path_1.default.join(__dirname, '..', 'client');
app.use(express_1.default.static(clientDist));
app.get('/{*any}', (req, res, next) => {
    if (req.path.startsWith('/api'))
        return next();
    const indexPath = path_1.default.join(clientDist, 'index.html');
    if (fs_1.default.existsSync(indexPath)) {
        res.sendFile(indexPath);
    }
    else {
        res.status(500).send('Frontend not built or missing.');
    }
});
const PORT = Number(process.env.PORT) || 5050;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
