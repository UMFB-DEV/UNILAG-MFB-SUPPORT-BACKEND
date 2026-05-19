"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.reactivateUser = exports.deactivateUser = exports.updateUser = exports.createUser = exports.listUsers = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = __importDefault(require("../config/prisma"));
const apiError_1 = __importDefault(require("../utils/apiError"));
const listUsers = async () => {
    const users = await prisma_1.default.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            department: true,
            createdAt: true,
        },
        orderBy: { createdAt: "desc" },
    });
    const agentIds = users.filter((u) => u.role === "agent").map((u) => u.id);
    if (agentIds.length === 0) {
        return users;
    }
    const resolvedTickets = await prisma_1.default.ticket.findMany({
        where: {
            status: { in: ["resolved", "closed"] },
            resolvedAt: { not: null },
            assignedToId: { in: agentIds },
        },
        select: {
            assignedToId: true,
            assignedAt: true,
            reassignedAt: true,
            resolvedAt: true,
        },
    });
    const agentBuckets = resolvedTickets.reduce((acc, t) => {
        const agentId = t.assignedToId;
        const startAt = t.reassignedAt || t.assignedAt;
        if (!startAt || !t.resolvedAt)
            return acc;
        const durationMs = t.resolvedAt.getTime() - startAt.getTime();
        if (!Number.isFinite(durationMs) || durationMs < 0)
            return acc;
        const bucket = acc[agentId] || { sumMs: 0, count: 0 };
        bucket.sumMs += durationMs;
        bucket.count += 1;
        acc[agentId] = bucket;
        return acc;
    }, {});
    return users.map((u) => {
        if (u.role !== "agent")
            return u;
        const bucket = agentBuckets[u.id];
        const avgMinutes = bucket && bucket.count > 0
            ? Number(((bucket.sumMs / bucket.count) / (1000 * 60)).toFixed(2))
            : 0;
        return { ...u, averageAssignedToResolvedMinutes: avgMinutes };
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
        select: { id: true, email: true, role: true, isActive: true, department: true, createdAt: true },
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
        select: { id: true, email: true, role: true, isActive: true, department: true, createdAt: true },
    });
};
exports.updateUser = updateUser;
const deactivateUser = async (id) => {
    const existing = await prisma_1.default.user.findUnique({ where: { id } });
    if (!existing) {
        throw new apiError_1.default(404, "User not found");
    }
    return prisma_1.default.user.update({
        where: { id },
        data: { isActive: false },
        select: { id: true, name: true, email: true, role: true, isActive: true, department: true, createdAt: true },
    });
};
exports.deactivateUser = deactivateUser;
const reactivateUser = async (id) => {
    const existing = await prisma_1.default.user.findUnique({ where: { id } });
    if (!existing) {
        throw new apiError_1.default(404, "User not found");
    }
    return prisma_1.default.user.update({
        where: { id },
        data: { isActive: true },
        select: { id: true, name: true, email: true, role: true, isActive: true, department: true, createdAt: true },
    });
};
exports.reactivateUser = reactivateUser;
const deleteUser = async (id) => {
    const existing = await prisma_1.default.user.findUnique({ where: { id } });
    if (!existing) {
        throw new apiError_1.default(404, "User not found");
    }
    const createdTicketCount = await prisma_1.default.ticket.count({ where: { createdById: id } });
    if (createdTicketCount > 0) {
        throw new apiError_1.default(409, "Cannot delete user because they have created tickets. Reassign/delete the user's tickets first.");
    }
    await prisma_1.default.$transaction([
        prisma_1.default.comment.deleteMany({ where: { userId: id } }),
        prisma_1.default.passwordResetToken.deleteMany({ where: { userId: id } }),
        prisma_1.default.ticket.updateMany({ where: { assignedToId: id }, data: { assignedToId: null } }),
        prisma_1.default.user.delete({ where: { id } }),
    ]);
};
exports.deleteUser = deleteUser;
