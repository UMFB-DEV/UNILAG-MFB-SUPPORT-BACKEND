"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = __importDefault(require("./config/env"));
const prisma_1 = __importDefault(require("./config/prisma"));
const startServer = async () => {
    try {
        try {
            const rawUrl = process.env.DATABASE_URL;
            if (rawUrl) {
                const url = new URL(rawUrl);
                console.log(`Connecting to database at ${url.hostname}:${url.port || "5432"}`);
            }
            else {
                console.log("Connecting to database (DATABASE_URL not set)");
            }
        }
        catch {
            console.log("Connecting to database");
        }
        await prisma_1.default.$connect();
        await prisma_1.default.user.count();
        console.log("Database connection successful");
        app_1.default.listen(env_1.default.port, () => {
            console.log(`Server running on port ${env_1.default.port}`);
        });
    }
    catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};
void startServer();
