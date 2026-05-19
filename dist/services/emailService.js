"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const mailer_1 = require("../config/mailer");
const env_1 = __importDefault(require("../config/env"));
const sendEmail = async ({ to, subject, text }) => {
    if (!mailer_1.hasSmtpCredentials || !mailer_1.transporter) {
        console.log(`[email:skipped] ${subject} -> ${to}`);
        return;
    }
    try {
        await mailer_1.transporter.sendMail({
            from: env_1.default.smtp.from,
            to,
            subject,
            text,
        });
    }
    catch (err) {
        console.log(`[email:error] ${subject} -> ${to}`);
        console.log(err);
    }
};
exports.sendEmail = sendEmail;
