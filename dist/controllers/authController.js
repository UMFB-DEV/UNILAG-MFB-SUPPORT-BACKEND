"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.loginUser = exports.registerUser = void 0;
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const authService_1 = require("../services/authService");
const registerUser = (0, asyncHandler_1.default)(async (req, res) => {
    const result = await (0, authService_1.register)(req.body);
    res.status(201).json({ success: true, message: "Registered successfully", data: result });
});
exports.registerUser = registerUser;
const loginUser = (0, asyncHandler_1.default)(async (req, res) => {
    const result = await (0, authService_1.login)(req.body);
    res.json({ success: true, message: "Logged in successfully", data: result });
});
exports.loginUser = loginUser;
const me = (0, asyncHandler_1.default)(async (req, res) => {
    res.json({ success: true, data: req.user });
});
exports.me = me;
