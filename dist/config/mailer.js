"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasSmtpCredentials = exports.transporter = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = __importDefault(require("./env"));
const hasSmtpCredentials = Boolean(env_1.default.smtp.user && env_1.default.smtp.pass);
exports.hasSmtpCredentials = hasSmtpCredentials;
const transporter = hasSmtpCredentials
    ? nodemailer_1.default.createTransport({
        service: "gmail",
        auth: {
            user: env_1.default.smtp.user,
            pass: env_1.default.smtp.pass,
        },
    })
    : null;
exports.transporter = transporter;
