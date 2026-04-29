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

  try {
    await transporter.sendMail({
      from: env.smtp.from,
      to,
      subject,
      text,
    });
  } catch (err) {
    console.log(`[email:error] ${subject} -> ${to}`);
    console.log(err);
  }
};

export { sendEmail };
