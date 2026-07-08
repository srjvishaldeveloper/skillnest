import "server-only";
import nodemailer from "nodemailer";

/**
 * Notification transports — Email (SMTP via nodemailer) + SMS (Fast2SMS).
 * Both degrade gracefully: if env isn't configured, calls become no-ops and
 * never throw, so they can be fire-and-forget inside server actions.
 */

/* ============================ EMAIL (SMTP) ============================ */

const EMAIL_HOST = process.env.EMAIL_HOST || "";
const EMAIL_PORT = Number(process.env.EMAIL_PORT) || 587;
const EMAIL_USER = process.env.EMAIL_HOST_USER || "";
const EMAIL_PASS = process.env.EMAIL_HOST_PASSWORD || "";
const EMAIL_USE_SSL = (process.env.EMAIL_USE_SSL || "False") === "True";
const MAIL_FROM =
  (process.env.DEFAULT_FROM_EMAIL || EMAIL_USER || "").replace(/^['"]|['"]$/g, "") ||
  "SkillNest <no-reply@skillnest.local>";
const REPLY_TO = process.env.DEFAULT_REPLY_TO || undefined;

export const emailConfigured = () => !!(EMAIL_HOST && EMAIL_USER && EMAIL_PASS);

let _transporter: nodemailer.Transporter | null = null;
function transporter() {
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_USE_SSL, // false for 587 (STARTTLS), true for 465 (SSL)
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });
  return _transporter;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!emailConfigured()) return { ok: false, error: "Email not configured" };
  if (!to || (Array.isArray(to) && to.length === 0))
    return { ok: false, error: "No recipient" };
  try {
    await transporter().sendMail({
      from: MAIL_FROM,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      replyTo: REPLY_TO,
    });
    return { ok: true };
  } catch (e: any) {
    console.error("sendEmail error:", e?.message);
    return { ok: false, error: e?.message || "Send failed" };
  }
}

/* ============================ SMS (Fast2SMS) ============================ */

const F2S_KEY = process.env.FAST2SMS_API_KEY || "";
const F2S_SENDER = process.env.FAST2SMS_SENDER_ID || "";
const F2S_TEMPLATE = process.env.FAST2SMS_TEMPLATE_ID || "";

export const smsConfigured = () => !!(F2S_KEY && F2S_SENDER && F2S_TEMPLATE);

// Fast2SMS expects 10-digit Indian numbers (no +91 / spaces).
function normalizeNumber(raw: string): string | null {
  const digits = (raw || "").replace(/\D/g, "");
  const ten = digits.slice(-10);
  return ten.length === 10 ? ten : null;
}

/**
 * Send a DLT (transactional) SMS. `variables` fill the DLT template's
 * {#var#} placeholders in order, joined with "|".
 */
export async function sendSms({
  to,
  variables,
}: {
  to: string;
  variables: (string | number)[];
}): Promise<{ ok: boolean; error?: string }> {
  if (!smsConfigured()) return { ok: false, error: "SMS not configured" };
  const number = normalizeNumber(to);
  if (!number) return { ok: false, error: "Invalid phone number" };

  const params = new URLSearchParams({
    route: "dlt",
    sender_id: F2S_SENDER,
    message: F2S_TEMPLATE,
    variables_values: variables.map((v) => String(v)).join("|"),
    numbers: number,
    flash: "0",
  });

  try {
    const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: F2S_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({} as any));
    if (res.ok && data?.return === true) return { ok: true };
    return {
      ok: false,
      error: data?.message?.[0] || data?.message || `Fast2SMS error (HTTP ${res.status})`,
    };
  } catch (e: any) {
    console.error("sendSms error:", e?.message);
    return { ok: false, error: e?.message || "Network error" };
  }
}

/**
 * Send a one-time password over SMS using the configured DLT OTP template
 * (FAST2SMS_TEMPLATE_ID). SMS is reserved for OTP only; all other
 * notifications go over email.
 */
export async function sendOtp(phone: string, code: string | number) {
  return sendSms({ to: phone, variables: [code] });
}

/**
 * Fire-and-forget helper: never throws, runs both channels, used inside
 * server actions so a notification failure can't break the main flow.
 */
export async function notify(opts: {
  email?: { to: string | null | undefined; subject: string; html: string };
  sms?: { to: string | null | undefined; variables: (string | number)[] };
}) {
  const jobs: Promise<unknown>[] = [];
  if (opts.email?.to) {
    jobs.push(
      sendEmail({
        to: opts.email.to,
        subject: opts.email.subject,
        html: opts.email.html,
      }).catch(() => {})
    );
  }
  if (opts.sms?.to) {
    jobs.push(
      sendSms({ to: opts.sms.to, variables: opts.sms.variables }).catch(() => {})
    );
  }
  await Promise.allSettled(jobs);
}
