/**
 * Central notification templates. Edit copy here in one place.
 *
 * SECURITY: every user-controlled value interpolated into the HTML body is
 * passed through esc() to prevent HTML/email injection (CWE-79/CWE-80).
 * Email *subjects* are plain text, so they are NOT HTML-escaped.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const BRAND = "#2563EB";

/** HTML-escape untrusted values before embedding them in email HTML. */
const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** Branded email shell. `title`/`bodyHtml` must already be safe HTML. */
export function emailLayout(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f4f6fb;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #eef0f5">
      <div style="background:${BRAND};padding:18px 24px;color:#fff;font-size:18px;font-weight:bold">SkillNest</div>
      <div style="padding:24px">
        <h2 style="margin:0 0 12px;font-size:18px;color:#111827">${title}</h2>
        <div style="font-size:14px;line-height:1.6;color:#374151">${bodyHtml}</div>
      </div>
      <div style="padding:16px 24px;border-top:1px solid #eef0f5;font-size:12px;color:#9ca3af">
        SkillNest — Learn. Grow. Get Hired. · <a href="${APP_URL}" style="color:${BRAND}">${APP_URL}</a>
      </div>
    </div>
  </body></html>`;
}

// href is always a trusted, app-built URL (APP_URL/...), never user input.
const btn = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;margin-top:14px;background:${BRAND};color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:bold">${label}</a>`;

/* ============================ TEMPLATES ============================ */

export const tpl = {
  welcome: (name: string, username: string) => ({
    subject: `Welcome to SkillNest, ${name}! 🎉`,
    html: emailLayout(
      `Welcome aboard, ${esc(name)}!`,
      `<p>Your SkillNest account is ready. Your username is <b>${esc(username)}</b>.</p>
       <p>Browse courses, learn new skills, and earn certificates.</p>
       ${btn(`${APP_URL}/signin`, "Sign in to SkillNest")}`
    ),
  }),

  enrolled: (name: string, courseTitle: string, courseId: number) => ({
    subject: `You're enrolled — ${courseTitle}`,
    html: emailLayout(
      `Enrollment confirmed 🎓`,
      `<p>Hi ${esc(name)}, you're now enrolled in <b>${esc(courseTitle)}</b>.</p>
       ${btn(`${APP_URL}/learn/${courseId}`, "Start Learning")}`
    ),
  }),

  paymentSuccess: (
    name: string,
    courseTitle: string,
    amount: number,
    orderId: number,
    courseId: number
  ) => ({
    subject: `Payment successful — ${courseTitle}`,
    html: emailLayout(
      `Payment received ✅`,
      `<p>Hi ${esc(name)}, we received <b>₹${amount}</b> for <b>${esc(courseTitle)}</b>.</p>
       <p>Order <b>#${orderId}</b>. You're enrolled — happy learning!</p>
       ${btn(`${APP_URL}/learn/${courseId}`, "Go to Course")}`
    ),
  }),

  certificate: (name: string, courseTitle: string, code: string) => ({
    subject: `🎓 Certificate earned — ${courseTitle}`,
    html: emailLayout(
      `Congratulations, ${esc(name)}!`,
      `<p>You completed <b>${esc(courseTitle)}</b> and earned a certificate.</p>
       ${btn(`${APP_URL}/certificate/${encodeURIComponent(code)}`, "View / Download Certificate")}`
    ),
  }),

  /* ---------- instructor / admin ---------- */

  courseSubmitted: (instructor: string, courseTitle: string) => ({
    subject: `New course awaiting review — ${courseTitle}`,
    html: emailLayout(
      `Course submitted for review`,
      `<p><b>${esc(instructor)}</b> submitted <b>${esc(courseTitle)}</b> for approval.</p>
       ${btn(`${APP_URL}/admin/approvals`, "Review Now")}`
    ),
  }),

  courseApproved: (name: string, courseTitle: string, courseId: number) => ({
    subject: `✅ Your course is live — ${courseTitle}`,
    html: emailLayout(
      `Approved & published 🎉`,
      `<p>Hi ${esc(name)}, <b>${esc(courseTitle)}</b> has been approved and is now live on SkillNest.</p>
       ${btn(`${APP_URL}/course/${courseId}`, "View Course")}`
    ),
  }),

  courseRejected: (name: string, courseTitle: string, reason: string, courseId: number) => ({
    subject: `Changes requested — ${courseTitle}`,
    html: emailLayout(
      `Your course needs an update`,
      `<p>Hi ${esc(name)}, an admin reviewed <b>${esc(courseTitle)}</b> and requested changes:</p>
       <p style="background:#fff4f4;border-left:3px solid #ef4444;padding:8px 12px;border-radius:4px">${esc(reason)}</p>
       ${btn(`${APP_URL}/courses/${courseId}`, "Update & Resubmit")}`
    ),
  }),

  newQuestion: (
    instructor: string,
    courseTitle: string,
    qTitle: string,
    courseId: number,
    discussionId: number
  ) => ({
    subject: `New question in ${courseTitle}`,
    html: emailLayout(
      `A learner asked a question`,
      `<p>Hi ${esc(instructor)}, a new question was posted in <b>${esc(courseTitle)}</b>:</p>
       <p style="font-style:italic">“${esc(qTitle)}”</p>
       ${btn(`${APP_URL}/discuss/${courseId}/${discussionId}`, "Answer Now")}`
    ),
  }),

  answered: (
    learner: string,
    courseTitle: string,
    qTitle: string,
    courseId: number,
    discussionId: number
  ) => ({
    subject: `Your question was answered — ${courseTitle}`,
    html: emailLayout(
      `An instructor replied 💬`,
      `<p>Hi ${esc(learner)}, your question in <b>${esc(courseTitle)}</b> got a reply:</p>
       <p style="font-style:italic">“${esc(qTitle)}”</p>
       ${btn(`${APP_URL}/discuss/${courseId}/${discussionId}`, "View Answer")}`
    ),
  }),

  liveClassScheduled: (
    learner: string,
    courseTitle: string,
    liveTitle: string,
    whenStr: string,
    courseId: number
  ) => ({
    subject: `📅 Live class scheduled — ${courseTitle}`,
    html: emailLayout(
      `New live class 🎥`,
      `<p>Hi ${esc(learner)}, a live class has been scheduled in <b>${esc(courseTitle)}</b>:</p>
       <p><b>${esc(liveTitle)}</b><br/>🕒 ${esc(whenStr)}</p>
       ${btn(`${APP_URL}/learn/${courseId}`, "Go to Course")}`
    ),
  }),

  teacherVerified: (name: string) => ({
    subject: `✅ Your instructor profile is verified on SkillNest`,
    html: emailLayout(
      `Profile verified!`,
      `<p>Hi ${esc(name)}, your instructor profile has been verified by the admin.</p>
       <p>You can now create courses and share your knowledge on SkillNest.</p>
       ${btn(`${APP_URL}/courses`, "Start Creating Courses")}`
    ),
  }),

  newContent: (
    studentName: string,
    courseTitle: string,
    instructorName: string,
    contentType: string,
    contentTitle: string,
    courseId: number
  ) => ({
    subject: `New ${contentType} in ${courseTitle}`,
    html: emailLayout(
      `New course content added 📚`,
      `<p>Hi ${esc(studentName)},</p>
       <p><b>${esc(instructorName)}</b> added a new <b>${esc(contentType)}</b> — <b>${esc(contentTitle)}</b> in <b>${esc(courseTitle)}</b>.</p>
       <p>Check it out now!</p>
       ${btn(`${APP_URL}/learn/${courseId}`, "Go to Course")}`
    ),
  }),

  newReview: (
    instructor: string,
    courseTitle: string,
    rating: number,
    reviewer: string,
    courseId: number
  ) => ({
    subject: `New ${rating}★ review on ${courseTitle}`,
    html: emailLayout(
      `You got a new review ⭐`,
      `<p>Hi ${esc(instructor)}, <b>${esc(reviewer)}</b> rated <b>${esc(courseTitle)}</b> ${"★".repeat(
        Math.min(5, Math.max(0, Math.round(rating)))
      )} (${rating}/5).</p>
       ${btn(`${APP_URL}/course/${courseId}`, "View Course")}`
    ),
  }),
};

/* ---------- affiliate / organization ---------- */

export const tplSaas = {
  affiliateCommission: (name: string, commission: number, total: number) => ({
    subject: `💰 You earned ₹${commission} commission`,
    html: emailLayout(
      `New commission earned!`,
      `<p>Hi ${esc(name)}, you earned <b>₹${commission}</b> on a sale through your referral link.</p>
       <p>Total lifetime earnings: <b>₹${total}</b>.</p>
       ${btn(`${APP_URL}/affiliate`, "View Affiliate Dashboard")}`
    ),
  }),

  affiliateWelcome: (
    name: string,
    username: string,
    code: string,
    password: string
  ) => ({
    subject: `Your SkillNest affiliate account is ready 🤝`,
    html: emailLayout(
      `Welcome, partner!`,
      `<p>Hi ${esc(name)}, your SkillNest affiliate account has been created.</p>
       <p><b>Username:</b> ${esc(username)}<br/>
          <b>Temporary password:</b> ${esc(password)}<br/>
          <b>Your referral code:</b> ${esc(code)}</p>
       <p>Share your link to start earning commission on every sale.</p>
       ${btn(`${APP_URL}/signin`, "Sign in to Affiliate Dashboard")}`
    ),
  }),

  orgAdded: (name: string, orgName: string) => ({
    subject: `You've been added to ${orgName}`,
    html: emailLayout(
      `Welcome to ${esc(orgName)}`,
      `<p>Hi ${esc(name)}, you've been added to the organization <b>${esc(orgName)}</b> on SkillNest.</p>
       ${btn(`${APP_URL}/signin`, "Sign in")}`
    ),
  }),
};

// Where admin/platform notifications go (admins have no email field).
export const ADMIN_EMAIL =
  process.env.ADMIN_NOTIFY_EMAIL || process.env.DEFAULT_REPLY_TO || "";
