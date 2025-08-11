"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkUsageLimit = void 0;
const supabaseClient_1 = require("../services/supabaseClient");
const subscriptionLimit_1 = require("./subscriptionLimit");
const checkUsageLimit = async (userId, usageType) => {
    const { data: user, error } = await supabaseClient_1.supabase
        .from('users')
        .select('plan, ask_count, analysis_count, scenario_count, subscription_active')
        .eq('id', userId)
        .single();
    if (error || !user) {
        return { allowed: false, message: 'User not found.' };
    }
    const plan = user.plan; // <-- Add this type assertion
    const limits = subscriptionLimit_1.PLAN_LIMITS[plan];
    if (!limits) {
        return { allowed: false, message: 'Unknown subscription plan.' };
    }
    const currentUsage = user[usageType];
    const allowedUsage = {
        ask_count: limits.askLimit,
        analysis_count: limits.analysisLimit,
        scenario_count: limits.scenarioLimit,
    }[usageType];
    const isAllowed = currentUsage > 0;
    return {
        allowed: isAllowed,
        message: isAllowed ? undefined : `Limit reached for ${usageType.replace('_', ' ')}`,
    };
};
exports.checkUsageLimit = checkUsageLimit;
