/* VolunteerConnect password-reset API add-on.
   Attach after creating app and pool, before app.listen:
   require("./password-reset-routes")(app, pool);
   Setup instructions: see README.txt.
*/
"use strict";

const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { rateLimit } = require("express-rate-limit");

const GENERIC_MESSAGE =
  "If an active account exists for that email, a password-reset link will be sent shortly.";

function makeTransport() {
  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
}

function getResetUrl(token) {
  const base = process.env.FRONTEND_URL;
  if (!base) throw new Error("Missing FRONTEND_URL");
  const url = new URL("reset-password.html", base.endsWith("/") ? base : base + "/");
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Invalid FRONTEND_URL");
  if (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname)) {
    throw new Error("FRONTEND_URL must use HTTPS outside local development");
  }
  url.searchParams.set("token", token);
  return url.toString();
}

module.exports = function registerPasswordResetRoutes(app, pool) {
  const requestLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 8,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Too many requests. Try again in 15 minutes." }
  });
  const resetLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 15,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Too many attempts. Try again in 15 minutes." }
  });

  app.post("/api/auth/forgot-password", requestLimit, async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Enter a valid email address." });
    }

    // Report unavailable service regardless of whether that email is registered.
    const needed = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM", "FRONTEND_URL"];
    if (needed.some((name) => !process.env[name])) {
      console.error("Password recovery: missing SMTP / FRONTEND_URL settings in Backend/.env");
      return res.status(503).json({ error: "Email recovery is not configured yet. Please contact support." });
    }

    try {
      const result = await pool.query(
        "SELECT user_id, email FROM users WHERE LOWER(email) = $1 AND is_active = TRUE LIMIT 1",
        [email]
      );
      if (!result.rows.length) return res.json({ message: GENERIC_MESSAGE });

      const user = result.rows[0];
      // Per-account cooldown to reduce mail spam; same response for all outcomes.
      const recentlyRequested = await pool.query(
        "SELECT 1 FROM password_reset_token WHERE user_id = $1 AND created_at > NOW() - INTERVAL '60 seconds'",
        [user.user_id]
      );
      if (recentlyRequested.rowCount) return res.json({ message: GENERIC_MESSAGE });

      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      const resetUrl = getResetUrl(rawToken);

      // Only hashed tokens, never raw links or passwords, are saved to PostgreSQL.
      await pool.query(
        `INSERT INTO password_reset_token (user_id, token_hash, expires_at, used_at, created_at)
         VALUES ($1, $2, NOW() + INTERVAL '30 minutes', NULL, NOW())
         ON CONFLICT (user_id) DO UPDATE
           SET token_hash = EXCLUDED.token_hash,
               expires_at = EXCLUDED.expires_at,
               used_at = NULL,
               created_at = NOW()`,
        [user.user_id, tokenHash]
      );

      try {
        await makeTransport().sendMail({
          from: process.env.SMTP_FROM,
          to: user.email,
          subject: "VolunteerConnect - reset your password",
          text: `A password reset was requested for your VolunteerConnect account.\n\n` +
            `Open this link within 30 minutes:\n${resetUrl}\n\n` +
            `If you did not request this, ignore this email. The link can only be used once.`
        });
      } catch (mailError) {
        // Don't leave an unusable token on record when email delivery fails.
        await pool.query(
          "DELETE FROM password_reset_token WHERE user_id = $1 AND token_hash = $2",
          [user.user_id, tokenHash]
        );
        console.error("Password recovery: SMTP send failed:", mailError.message);
        // Respond identically for registered and unregistered emails.
        return res.json({ message: GENERIC_MESSAGE });
      }
      return res.json({ message: GENERIC_MESSAGE });
    } catch (error) {
      console.error("Password recovery request error:", error);
      return res.status(500).json({ error: "Password recovery is temporarily unavailable." });
    }
  });

  app.post("/api/auth/reset-password", resetLimit, async (req, res) => {
    const token = String(req.body?.token || "");
    const password = req.body?.password;
    if (!/^[a-f0-9]{64}$/.test(token)) {
      return res.status(400).json({ error: "Invalid or expired reset link." });
    }
    if (typeof password !== "string" || password.length < 12 || Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({ error: "Password must be at least 12 characters and at most 72 UTF-8 bytes." });
    }
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    let client;
    try {
      client = await pool.connect();
      await client.query("BEGIN");
      const result = await client.query(
        `SELECT user_id FROM password_reset_token
         WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
         FOR UPDATE`,
        [tokenHash]
      );
      if (!result.rows.length) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Invalid or expired reset link. Please request a new one." });
      }
      const userId = result.rows[0].user_id;
      const passwordHash = await bcrypt.hash(password, 12);
      await client.query("UPDATE users SET password_hash = $1 WHERE user_id = $2", [passwordHash, userId]);
      await client.query("UPDATE password_reset_token SET used_at = NOW() WHERE user_id = $1", [userId]);
      await client.query("COMMIT");
      return res.json({ message: "Your password has been changed successfully." });
    } catch (error) {
      if (client) {
        try { await client.query("ROLLBACK"); } catch (rollbackError) { console.error("Password reset rollback failed:", rollbackError); }
      }
      console.error("Password reset error:", error);
      return res.status(500).json({ error: "Unable to reset your password right now." });
    } finally {
      if (client) client.release();
    }
  });
};
