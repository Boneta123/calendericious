/**
 * Email sending (password-reset codes) via Resend.
 *
 * The 6-digit code is generated/stored/verified by OUR backend — Resend only
 * DELIVERS the message. If RESEND_API_KEY is unset we fall back to logging the
 * code to the server console so the flow is testable before Resend is set up.
 * Reads process.env only — never the .env file, never logs the API key.
 */
import { Resend } from 'resend';

const FROM = process.env.RESEND_FROM;

/** Deliver a password-reset code to `toEmail`. Never throws. */
export async function sendPasswordResetEmail(toEmail, code) {
  const apiKey = process.env.RESEND_API_KEY;

  // DEV FALLBACK: no key configured → print the code so resets are testable.
  if (!apiKey) {
    console.log(`[email] (dev) reset code for ${toEmail}: ${code}  (set RESEND_API_KEY to send real emails)`);
    return;
  }

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: FROM,
      to: toEmail,
      subject: 'Your Calendericious reset code',
      text: `Your password reset code is ${code}. It expires in 15 minutes. If you didn't request this, ignore this email.`,
      html:
        `<div style="font-family:system-ui,sans-serif;color:#2B1B2E">` +
        `<h2 style="color:#FF5A36;margin:0 0 8px">Calendericious</h2>` +
        `<p>Your password reset code is:</p>` +
        `<p style="font-size:28px;font-weight:800;letter-spacing:4px;font-family:monospace">${code}</p>` +
        `<p style="color:#7A6A70">It expires in 15 minutes. If you didn't request this, you can ignore this email.</p>` +
        `</div>`,
    });
  } catch (err) {
    // Non-blocking: the forgot-password endpoint still returns generic success.
    console.error('[email] Resend send failed:', err && err.message ? err.message : err);
  }
}
