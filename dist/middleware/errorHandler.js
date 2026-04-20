"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apiError_1 = __importDefault(require("../utils/apiError"));
const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }
    if (err.name === "ZodError") {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: err.issues,
        });
    }
    if (err instanceof apiError_1.default) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            details: err.details,
        });
    }
    console.error("Unhandled error:", err);
    return res.status(500).json({
        success: false,
        message: "Internal server error",
    });
};
exports.default = errorHandler;
