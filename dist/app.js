"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
const ticketRoutes_1 = __importDefault(require("./routes/ticketRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const authMiddleware_1 = require("./middleware/authMiddleware");
const errorHandler_1 = __importDefault(require("./middleware/errorHandler"));
const env_1 = __importDefault(require("./config/env"));
const app = (0, express_1.default)();
app.disable("etag");
app.set("etag", false);
app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    next();
});
// CORS configuration
app.use((0, cors_1.default)({
    origin: [env_1.default.frontendUrl, "http://localhost:3000"],
    credentials: true
}));
app.use(express_1.default.json());
app.use((0, morgan_1.default)("dev"));
app.get("/health", (req, res) => {
    res.json({ success: true, message: "Ticketing API is running" });
});
app.get("/departments", (req, res) => {
    res.json({
        success: true,
        data: [
            "Internal control and risk department",
            "Credit department",
            "Compliance",
            "Human resources department",
            "It department",
            "Marketing",
            "Operations",
        ],
    });
});
app.use("/auth", authRoutes_1.default);
app.use("/users", authMiddleware_1.authenticate, userRoutes_1.default);
app.use("/tickets", authMiddleware_1.authenticate, ticketRoutes_1.default);
app.use("/reports", authMiddleware_1.authenticate, reportRoutes_1.default);
app.use(errorHandler_1.default);
exports.default = app;
