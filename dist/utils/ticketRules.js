"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertTransitionAllowed = exports.allowedTransitions = void 0;
const apiError_1 = __importDefault(require("./apiError"));
const allowedTransitions = {
    open: ["in_progress"],
    in_progress: ["resolved"],
    resolved: ["closed"],
    closed: [],
};
exports.allowedTransitions = allowedTransitions;
const assertTransitionAllowed = (currentStatus, nextStatus) => {
    const allowed = allowedTransitions[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
        throw new apiError_1.default(400, `Invalid status transition from ${currentStatus} to ${nextStatus}`);
    }
};
exports.assertTransitionAllowed = assertTransitionAllowed;
