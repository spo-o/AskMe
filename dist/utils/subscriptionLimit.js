"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLAN_LIMITS = void 0;
exports.PLAN_LIMITS = {
    free: {
        askLimit: 0,
        analysisLimit: 3,
        scenarioLimit: 0,
    },
    starter_annual: {
        askLimit: 4,
        analysisLimit: 10,
        scenarioLimit: 5,
    },
    starter_monthly: {
        askLimit: 4,
        analysisLimit: 10,
        scenarioLimit: 5,
    },
    pro_annual: {
        askLimit: Infinity,
        analysisLimit: Infinity,
        scenarioLimit: 10,
    },
    pro_monthly: {
        askLimit: Infinity,
        analysisLimit: Infinity,
        scenarioLimit: 10,
    },
    visionary: {
        askLimit: Infinity,
        analysisLimit: Infinity,
        scenarioLimit: Infinity,
    },
};
