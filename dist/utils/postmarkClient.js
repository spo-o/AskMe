"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const postmark_1 = require("postmark");
const postmarkClient = new postmark_1.Client(process.env.POSTMARK_API_KEY);
exports.default = postmarkClient;
