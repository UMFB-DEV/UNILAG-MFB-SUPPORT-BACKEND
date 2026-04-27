"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
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
        select: { id: true, name: true, email: true, role: true, department: true, createdAt: true },
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
const login = async ({ email, password }) => {
    const user = await prisma_1.default.user.findUnique({ where: { email } });
    if (!user) {
        throw new apiError_1.default(401, "Invalid credentials");
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
        department: user.department,
        createdAt: user.createdAt,
    };
    return { user: safeUser, token: createToken(user) };
};
exports.login = login;
