"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
const roles = zod_1.z.enum(["admin", "agent", "user"]);
const createUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    role: roles,
    department: zod_1.z.string().min(2).optional(),
});
exports.createUserSchema = createUserSchema;
const updateUserSchema = zod_1.z
    .object({
    email: zod_1.z.string().email().optional(),
    password: zod_1.z.string().min(8).optional(),
    role: roles.optional(),
    department: zod_1.z.string().min(2).nullable().optional(),
})
    .refine((obj) => Object.keys(obj).length > 0, {
    message: "At least one field is required",
});
exports.updateUserSchema = updateUserSchema;
