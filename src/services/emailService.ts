import { hasSmtpCredentials, transporter } from "../config/mailer";
import env from "../config/env";

type EmailPayload = {
  to: string;
  subject: string;
  text: string;
};

const sendEmail = async ({ to, subject, text }: EmailPayload): Promise<void> => {
  if (!hasSmtpCredentials || !transporter) {
    console.log(`[email:skipped] ${subject} -> ${to}`);
    return;
  }

  await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject,
    text,
  });
};

export { sendEmail };
