import nodemailer from "nodemailer";
import env from "./env";

const hasSmtpCredentials = Boolean(env.smtp.user && env.smtp.pass);

const transporter = hasSmtpCredentials
  ? nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass,
      },
    })
  : null;

export { transporter, hasSmtpCredentials };
