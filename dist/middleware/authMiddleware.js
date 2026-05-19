"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../config/prisma"));
const env_1 = __importDefault(require("../config/env"));
const apiError_1 = __importDefault(require("../utils/apiError"));
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new apiError_1.default(401, "Authorization token is missing");
    }
    const token = authHeader.split(" ")[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.default.jwtSecret);
        if (!payload.sub || typeof payload.sub !== "string") {
            throw new apiError_1.default(401, "Invalid token subject");
        }
        const user = await prisma_1.default.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, name: true, email: true, role: true, department: true, isActive: true },
        });
        if (!user) {
            throw new apiError_1.default(401, "User no longer exists");
        }
        if (user.isActive === false) {
            throw new apiError_1.default(403, "Account deactivated");
        }
        req.user = user;
        next();
    }
    catch (error) {
        if (error instanceof apiError_1.default) {
            throw error;
        }
        throw new apiError_1.default(401, "Invalid or expired token");
    }
};
exports.authenticate = authenticate;
const authorize = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        throw new apiError_1.default(403, "Forbidden");
    }
    next();
};
exports.authorize = authorize;
