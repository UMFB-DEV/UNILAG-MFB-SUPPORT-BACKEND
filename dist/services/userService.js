"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.createUser = exports.listUsers = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = __importDefault(require("../config/prisma"));
const apiError_1 = __importDefault(require("../utils/apiError"));
const listUsers = async () => {
    return prisma_1.default.user.findMany({
        select: {
            id: true,
            email: true,
            role: true,
            department: true,
            createdAt: true,
        },
        orderBy: { createdAt: "desc" },
    });
};
exports.listUsers = listUsers;
const createUser = async ({ email, password, role, department }) => {
    const existing = await prisma_1.default.user.findUnique({ where: { email } });
    if (existing) {
        throw new apiError_1.default(409, "Email is already in use");
    }
    const hashed = await bcrypt_1.default.hash(password, 10);
    return prisma_1.default.user.create({
        data: { email, password: hashed, role, department },
        select: { id: true, email: true, role: true, department: true, createdAt: true },
    });
};
exports.createUser = createUser;
const updateUser = async (id, payload) => {
    const existing = await prisma_1.default.user.findUnique({ where: { id } });
    if (!existing) {
        throw new apiError_1.default(404, "User not found");
    }
    const data = { ...payload };
    if (payload.password) {
        data.password = await bcrypt_1.default.hash(payload.password, 10);
    }
    return prisma_1.default.user.update({
        where: { id },
        data,
        select: { id: true, email: true, role: true, department: true, createdAt: true },
    });
};
exports.updateUser = updateUser;
const deleteUser = async (id) => {
    const existing = await prisma_1.default.user.findUnique({ where: { id } });
    if (!existing) {
        throw new apiError_1.default(404, "User not found");
    }
    await prisma_1.default.user.delete({ where: { id } });
};
exports.deleteUser = deleteUser;
