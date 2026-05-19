"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reactivateUser = exports.deactivateUser = exports.updateUser = exports.createUser = exports.listUsers = void 0;
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const userService = __importStar(require("../services/userService"));
const listUsers = (0, asyncHandler_1.default)(async (req, res) => {
    const users = await userService.listUsers();
    console.log("[listUsers] firstUserKeys=", Object.keys(users[0] || {}));
    res.json({ success: true, data: users });
});
exports.listUsers = listUsers;
const createUser = (0, asyncHandler_1.default)(async (req, res) => {
    const user = await userService.createUser(req.body);
    res.status(201).json({ success: true, message: "User created", data: user });
});
exports.createUser = createUser;
const updateUser = (0, asyncHandler_1.default)(async (req, res) => {
    const user = await userService.updateUser(String(req.params.id), req.body);
    res.json({ success: true, message: "User updated", data: user });
});
exports.updateUser = updateUser;
const deactivateUser = (0, asyncHandler_1.default)(async (req, res) => {
    const user = await userService.deactivateUser(String(req.params.id));
    res.json({ success: true, message: "User deactivated", data: user });
});
exports.deactivateUser = deactivateUser;
const reactivateUser = (0, asyncHandler_1.default)(async (req, res) => {
    const user = await userService.reactivateUser(String(req.params.id));
    res.json({ success: true, message: "User reactivated", data: user });
});
exports.reactivateUser = reactivateUser;
