"use strict";

// Register in server.js in place of the old application status route:
// app.put('/api/applications/:id/status', requireAuth,
//   require('./application-decision-email')(pool));
//
// Uses SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASSWORD / SMTP_FROM
// from the existing password-recovery email setup.

const nodemailer = require("nodemailer");

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const TIMEZONE = "Africa/Johannesburg";
const dateFormatter = new Intl.DateTimeFormat("en-ZA", {
  timeZone: TIMEZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric"
});
const timeFormatter = new Intl.DateTimeFormat("en-ZA", {
  timeZone: TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23"
});

function eventWhen(row) {
  const start = new Date(row.start_datetime);
  const end = new Date(row.end_datetime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { date: "Contact the organisation for details", time: "To be confirmed" };
  }
  const sameDay = dateFormatter.format(start) === dateFormatter.format(end);
  return {
    date: sameDay
      ? dateFormatter.format(start)
      : `${dateFormatter.format(start)} to ${dateFormatter.format(end)}`,
    time: `${timeFormatter.format(start)} – ${timeFormatter.format(end)} (South Africa time)`
  };
}

function transporter() {
  const required = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) throw new Error(`Missing email settings: ${missing.join(", ")}`);
  const port = Number(process.env.SMTP_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("Invalid SMTP_PORT");
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
  });
}

async function sendAcceptanceEmail(row) {
  const when = eventWhen(row);
  const greeting = row.first_name ? `Hello ${row.first_name},` : "Hello,";
  const description = row.description || "Further details will be provided by the organiser.";
  const contact = [row.organisation_email, row.organisation_phone].filter(Boolean).join(" · ");
  const contactText = contact ? `\nOrganiser contact: ${contact}` : "";

  const text = `${greeting}\n\n` +
    `Congratulations! Your application to volunteer at ${row.title} has been accepted.\n\n` +
    `Event: ${row.title}\n` +
    `Organised by: ${row.organisation_name}\n` +
    `Date: ${when.date}\n` +
    `Time: ${when.time}\n` +
    `Location: ${row.location || "To be confirmed"}\n` +
    `Description: ${description}` + contactText + "\n\n" +
    `Please contact the organisation if you have any questions.\n\n` +
    `VolunteerConnect Team`;

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:auto;color:#19283b;line-height:1.6">
      <h2 style="color:#166534">Your volunteer application was accepted!</h2>
      <p>${escapeHtml(greeting)}</p>
      <p>Congratulations! You have been accepted to volunteer at <strong>${escapeHtml(row.title)}</strong>.</p>
      <div style="padding:18px;border:1px solid #e5e7eb;border-radius:10px;background:#f9fafb">
        <h3 style="margin-top:0">Event details</h3>
        <p><strong>Event:</strong> ${escapeHtml(row.title)}</p>
        <p><strong>Organisation:</strong> ${escapeHtml(row.organisation_name)}</p>
        <p><strong>Date:</strong> ${escapeHtml(when.date)}</p>
        <p><strong>Time:</strong> ${escapeHtml(when.time)}</p>
        <p><strong>Location:</strong> ${escapeHtml(row.location || "To be confirmed")}</p>
        <p><strong>Description:</strong> ${escapeHtml(description).replace(/\r?\n/g, "<br>")}</p>
        ${contact ? `<p><strong>Organiser contact:</strong> ${escapeHtml(contact)}</p>` : ""}
      </div>
      <p>Please contact the organisation if you have any questions.</p>
      <p>VolunteerConnect Team</p>
    </div>`;

  return transporter().sendMail({
    from: process.env.SMTP_FROM,
    to: row.volunteer_email,
    subject: `VolunteerConnect: Application accepted - ${row.title}`,
    text,
    html
  });
}

module.exports = function makeApplicationDecisionHandler(pool) {
  return async function updateApplicationStatus(req, res) {
    if (req.auth?.role !== "organisation_admin" || !Number.isInteger(Number(req.auth?.user_id))) {
      return res.status(403).json({ error: "Organisation administrator access required." });
    }

    const applicationId = Number(req.params.id);
    const status = req.body?.status;
    if (!Number.isSafeInteger(applicationId) || applicationId < 1) {
      return res.status(400).json({ error: "Invalid application ID." });
    }
    if (!["pending", "accepted", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid application status." });
    }

    const client = await pool.connect().catch((err) => {
      console.error("Application decision: database connection failed", err);
      return null;
    });
    if (!client) return res.status(500).json({ error: "Database connection failed." });

    let row;
    let previousStatus;
    let changed = false;
    try {
      await client.query("BEGIN");
      // The logged-in admin must belong to the organisation that owns this opportunity.
      // Lock the application to prevent two concurrent accepts sending duplicate emails.
      const found = await client.query(
        `SELECT a.application_id, a.status AS previous_status, a.volunteer_id,
                u.email AS volunteer_email, vp.first_name,
                o.title, o.description, o.location, o.start_datetime, o.end_datetime,
                org.name AS organisation_name,
                org.email AS organisation_email, org.phone AS organisation_phone
           FROM application a
           JOIN users u ON u.user_id = a.volunteer_id
           JOIN volunteer_profile vp ON vp.volunteer_id = a.volunteer_id
           JOIN opportunity o ON o.opportunity_id = a.opportunity_id
           JOIN organisation org ON org.organisation_id = o.organisation_id
           JOIN organisation_member om
             ON om.organisation_id = org.organisation_id AND om.user_id = $2
           JOIN users admin_user
             ON admin_user.user_id = om.user_id
            AND admin_user.is_active = TRUE
            AND admin_user.role = 'organisation_admin'
          WHERE a.application_id = $1
          FOR UPDATE OF a`,
        [applicationId, req.auth.user_id]
      );
      if (found.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Application not found or not managed by your organisation." });
      }

      row = found.rows[0];
      previousStatus = row.previous_status;
      changed = status !== previousStatus;
      if (changed) {
        await client.query(
          `UPDATE application
              SET status = $1::VARCHAR,
                  decision_at = CASE WHEN $1::VARCHAR = 'pending'
                                     THEN NULL ELSE CURRENT_TIMESTAMP END
            WHERE application_id = $2`,
          [status, applicationId]
        );

        if (status === "accepted") {
          await client.query(
            `INSERT INTO notification (user_id, message)
             VALUES ($1, $2)`,
            [row.volunteer_id, `Your application for ${row.title} was accepted by ${row.organisation_name}.`]
          );
        }
      }
      await client.query("COMMIT");
    } catch (err) {
      try { await client.query("ROLLBACK"); } catch {}
      console.error("Application decision: database update failed", err);
      return res.status(500).json({ error: "Unable to update application." });
    } finally {
      client.release();
    }

    // Notify only on a real transition to accepted. A mail failure never reverses
    // the accepted status; the response tells the admin what happened.
    let emailSent = null;
    let emailMessage;
    if (status === "accepted" && changed) {
      try {
        await sendAcceptanceEmail(row);
        emailSent = true;
      } catch (err) {
        emailSent = false;
        emailMessage = "Application accepted, but email delivery failed. Check backend SMTP logs.";
        console.error("Application acceptance email failed:", err);
      }
    }

    return res.json({
      application_id: applicationId,
      status,
      changed,
      email_sent: emailSent,
      ...(emailMessage ? { message: emailMessage } : {})
    });
  };
};
