import { Resend } from "resend";

const resendKey = process.env.RESEND_API_KEY;
const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "lillyansbeautystudio@gmail.com";
const fromEmail = process.env.FROM_EMAIL || "Lillyan's Beauty Studio <onboarding@resend.dev>";

export async function sendEmail({ to, subject, text }: { to: string; subject: string; text: string }) {
  if (!resendKey) return { skipped: true };
  const resend = new Resend(resendKey);
  return resend.emails.send({ from: fromEmail, to, subject, text });
}

export async function notifyAdmin(subject: string, text: string) {
  return sendEmail({ to: adminEmail, subject, text });
}

export async function notifyClient(email: string | undefined, subject: string, text: string) {
  if (!email) return { skipped: true };
  return sendEmail({ to: email, subject, text });
}
