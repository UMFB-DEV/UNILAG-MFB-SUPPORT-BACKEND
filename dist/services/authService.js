"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.resetPassword = exports.forgotPassword = exports.login = exports.registerAgent = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../config/prisma"));
const env_1 = __importDefault(require("../config/env"));
const apiError_1 = __importDefault(require("../utils/apiError"));
const emailService_1 = require("./emailService");
const createToken = (user) => jsonwebtoken_1.default.sign({ role: user.role, email: user.email }, env_1.default.jwtSecret, {
    subject: user.id,
    expiresIn: env_1.default.jwtExpiresIn,
});
const register = async ({ name, email, password, department }) => {
    const existing = await prisma_1.default.user.findUnique({ where: { email } });
    if (existing) {
        throw new apiError_1.default(409, "Email is already in use");
    }
    const hashed = await bcrypt_1.default.hash(password, 10);
    const user = await prisma_1.default.user.create({
        data: {
            name,
            email,
            password: hashed,
            role: "user",
            department,
        },
        select: { id: true, name: true, email: true, role: true, isActive: true, department: true, createdAt: true },
    });
    // Send welcome email
    await (0, emailService_1.sendEmail)({
        to: user.email,
        subject: "Welcome to Ticketing System",
        text: `Welcome ${user.name ?? user.email}! Your account has been created successfully. You can now create and manage tickets in our system.`,
    });
    return { user, token: createToken(user) };
};
exports.register = register;
const registerAgent = async ({ name, email, password, department }) => {
    const existing = await prisma_1.default.user.findUnique({ where: { email } });
    if (existing) {
        throw new apiError_1.default(409, "Email is already in use");
    }
    const hashed = await bcrypt_1.default.hash(password, 10);
    const user = await prisma_1.default.user.create({
        data: {
            name,
            email,
            password: hashed,
            role: "agent",
            department,
        },
        select: { id: true, name: true, email: true, role: true, isActive: true, department: true, createdAt: true },
    });
    await (0, emailService_1.sendEmail)({
        to: user.email,
        subject: "Welcome to Ticketing System",
        text: `Welcome ${user.name ?? user.email}! Your agent account has been created successfully.`,
    });
    return { user, token: createToken(user) };
};
exports.registerAgent = registerAgent;
const login = async ({ email, password }) => {
    const user = await prisma_1.default.user.findUnique({ where: { email } });
    if (!user) {
        throw new apiError_1.default(401, "Invalid credentials");
    }
    if (user.isActive === false) {
        throw new apiError_1.default(403, "Account deactivated");
    }
    const match = await bcrypt_1.default.compare(password, user.password);
    if (!match) {
        throw new apiError_1.default(401, "Invalid credentials");
    }
    const safeUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        department: user.department,
        createdAt: user.createdAt,
    };
    return { user: safeUser, token: createToken(user) };
};
exports.login = login;
const forgotPassword = async ({ email }) => {
    const user = await prisma_1.default.user.findUnique({ where: { email } });
    // Always return success to avoid user enumeration
    if (!user) {
        return { message: "If an account exists for that email, a reset link has been sent." };
    }
    const rawToken = crypto_1.default.randomBytes(32).toString("hex");
    const tokenHash = crypto_1.default.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + env_1.default.passwordResetTokenExpiresMinutes * 60 * 1000);
    await prisma_1.default.passwordResetToken.create({
        data: {
            tokenHash,
            userId: user.id,
            expiresAt,
        },
    });
    const resetLink = `${env_1.default.frontendUrl}/reset-password?token=${rawToken}`;
    await (0, emailService_1.sendEmail)({
        to: user.email,
        subject: "Reset your password",
        text: `You requested a password reset. Use the link below to set a new password (expires in ${env_1.default.passwordResetTokenExpiresMinutes} minutes):\n\n${resetLink}\n\nIf you did not request this, you can ignore this email.`,
    });
    return { message: "If an account exists for that email, a reset link has been sent." };
};
exports.forgotPassword = forgotPassword;
const resetPassword = async ({ token, newPassword }) => {
    const tokenHash = crypto_1.default.createHash("sha256").update(token).digest("hex");
    const record = await prisma_1.default.passwordResetToken.findUnique({
        where: { tokenHash },
        include: { user: true },
    });
    if (!record) {
        throw new apiError_1.default(400, "Invalid or expired reset token");
    }
    if (record.usedAt) {
        throw new apiError_1.default(400, "Invalid or expired reset token");
    }
    if (record.expiresAt.getTime() < Date.now()) {
        throw new apiError_1.default(400, "Invalid or expired reset token");
    }
    const hashed = await bcrypt_1.default.hash(newPassword, 10);
    await prisma_1.default.$transaction([
        prisma_1.default.user.update({
            where: { id: record.userId },
            data: { password: hashed },
        }),
        prisma_1.default.passwordResetToken.update({
            where: { id: record.id },
            data: { usedAt: new Date() },
        }),
    ]);
    return { message: "Password reset successful" };
};
exports.resetPassword = resetPassword;
const updateProfile = async (payload, user) => {
    const data = {};
    if (payload.email && payload.email !== user.email) {
        const existing = await prisma_1.default.user.findUnique({ where: { email: payload.email } });
        if (existing) {
            throw new apiError_1.default(409, "Email is already in use");
        }
        data.email = payload.email;
    }
    if (payload.name !== undefined) {
        data.name = payload.name;
    }
    const updated = await prisma_1.default.user.update({
        where: { id: user.id },
        data,
        select: { id: true, email: true, name: true, role: true, isActive: true, department: true, createdAt: true },
    });
    return { user: updated };
};
exports.updateProfile = updateProfile;
