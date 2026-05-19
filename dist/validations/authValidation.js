"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.loginSchema = exports.registerAgentSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    department: zod_1.z.string().min(2).optional(),
});
exports.registerSchema = registerSchema;
const registerAgentSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    department: zod_1.z.string().min(2),
});
exports.registerAgentSchema = registerAgentSchema;
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
exports.loginSchema = loginSchema;
const forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
exports.forgotPasswordSchema = forgotPasswordSchema;
const resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(10),
    newPassword: zod_1.z.string().min(8),
});
exports.resetPasswordSchema = resetPasswordSchema;
const updateProfileSchema = zod_1.z
    .object({
    email: zod_1.z.string().email().optional(),
    name: zod_1.z.string().min(2).optional(),
})
    .refine((obj) => Object.keys(obj).length > 0, {
    message: "At least one field is required",
});
exports.updateProfileSchema = updateProfileSchema;
