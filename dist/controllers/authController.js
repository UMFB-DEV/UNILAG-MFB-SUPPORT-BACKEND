"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileUser = exports.resetPasswordUser = exports.forgotPasswordUser = exports.me = exports.loginUser = exports.registerAgentUser = exports.registerUser = void 0;
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const authService_1 = require("../services/authService");
const registerUser = (0, asyncHandler_1.default)(async (req, res) => {
    const result = await (0, authService_1.register)(req.body);
    res.status(201).json({ success: true, message: "Registered successfully", data: result });
});
exports.registerUser = registerUser;
const registerAgentUser = (0, asyncHandler_1.default)(async (req, res) => {
    const result = await (0, authService_1.registerAgent)(req.body);
    res.status(201).json({ success: true, message: "Registered successfully", data: result });
});
exports.registerAgentUser = registerAgentUser;
const loginUser = (0, asyncHandler_1.default)(async (req, res) => {
    const result = await (0, authService_1.login)(req.body);
    res.json({ success: true, message: "Logged in successfully", data: result });
});
exports.loginUser = loginUser;
const me = (0, asyncHandler_1.default)(async (req, res) => {
    res.json({ success: true, data: req.user });
});
exports.me = me;
const forgotPasswordUser = (0, asyncHandler_1.default)(async (req, res) => {
    const result = await (0, authService_1.forgotPassword)(req.body);
    res.json({ success: true, message: result.message });
});
exports.forgotPasswordUser = forgotPasswordUser;
const resetPasswordUser = (0, asyncHandler_1.default)(async (req, res) => {
    const result = await (0, authService_1.resetPassword)(req.body);
    res.json({ success: true, message: result.message });
});
exports.resetPasswordUser = resetPasswordUser;
const updateProfileUser = (0, asyncHandler_1.default)(async (req, res) => {
    const result = await (0, authService_1.updateProfile)(req.body, req.user);
    res.json({ success: true, message: "Profile updated", data: result });
});
exports.updateProfileUser = updateProfileUser;
