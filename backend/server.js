require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

const PORT = Number(process.env.PORT || 5000);

/* =========================================================
   TEST API
========================================================= */

app.get("/", (req, res) => {
  res.json({
    message: "Community Volunteer Coordination Platform API"
  });
});

app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS current_time");

    res.json({
      success: true,
      message: "PostgreSQL connected successfully",
      current_time: result.rows[0].current_time
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: "Database connection failed"
    });
  }
});

/* =========================================================
   REGISTER
========================================================= */

app.post("/api/register", async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      email,
      password,
      role,
      first_name,
      last_name,
      phone,
      location,
      organisation_name
    } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        error: "Email, password and role are required."
      });
    }

    if (!["volunteer", "organisation_admin"].includes(role)) {
      return res.status(400).json({
        error: "Invalid user role."
      });
    }

    const existingUser = await client.query(
      "SELECT user_id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: "An account with this email already exists."
      });
    }

    await client.query("BEGIN");

    const passwordHash = await bcrypt.hash(password, 10);

    const userResult = await client.query(
      `
      INSERT INTO users
      (email, password_hash, role)
      VALUES ($1, $2, $3)
      RETURNING user_id, email, role
      `,
      [email, passwordHash, role]
    );

    const user = userResult.rows[0];

    if (role === "volunteer") {
      if (!first_name || !last_name) {
        throw new Error("Volunteer first name and last name are required.");
      }

      await client.query(
        `
        INSERT INTO volunteer_profile
        (volunteer_id, first_name, last_name, phone, location, availability_summary)
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          user.user_id,
          first_name,
          last_name,
          phone || null,
          location || null,
          "Not specified"
        ]
      );
    }

    if (role === "organisation_admin") {
      if (!organisation_name) {
        throw new Error("Organisation name is required.");
      }

      const organisationResult = await client.query(
        `
        INSERT INTO organisation
        (name, email, phone, address, verification_status)
        VALUES ($1, $2, $3, $4, 'pending')
        RETURNING organisation_id
        `,
        [
          organisation_name,
          email,
          phone || null,
          location || null
        ]
      );

      await client.query(
        `
        INSERT INTO organisation_member
        (organisation_id, user_id, member_role)
        VALUES ($1, $2, 'admin')
        `,
        [
          organisationResult.rows[0].organisation_id,
          user.user_id
        ]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Account created successfully.",
      user
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error(error);

    res.status(500).json({
      error: error.message || "Registration failed."
    });

  } finally {
    client.release();
  }
});

/* =========================================================
   LOGIN
========================================================= */

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      `
      SELECT
        user_id,
        email,
        password_hash,
        role,
        is_active
      FROM users
      WHERE email = $1
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid email or password."
      });
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!validPassword) {
      return res.status(401).json({
        error: "Invalid email or password."
      });
    }

    let organisation_id = null;

    if (user.role === "organisation_admin") {
      const orgResult = await pool.query(
        `
        SELECT organisation_id
        FROM organisation_member
        WHERE user_id = $1
        LIMIT 1
        `,
        [user.user_id]
      );

      organisation_id =
        orgResult.rows[0]?.organisation_id || null;
    }

    res.json({
      message: "Login successful.",
      user: {
        user_id: user.user_id,
        email: user.email,
        role: user.role,
        organisation_id
      }
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Login failed."
    });
  }
});

/* =========================================================
   OPPORTUNITIES
========================================================= */

app.get("/api/opportunities", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        o.opportunity_id,
        o.organisation_id,
        org.name AS organisation_name,
        o.title,
        o.description,
        o.location,
        o.start_datetime,
        o.end_datetime,
        o.required_volunteers,
        o.status,
        COUNT(a.application_id)::INTEGER AS signed
      FROM opportunity o
      JOIN organisation org
        ON o.organisation_id = org.organisation_id
      LEFT JOIN application a
        ON o.opportunity_id = a.opportunity_id
        AND a.status IN ('pending', 'accepted')
      GROUP BY
        o.opportunity_id,
        org.name
      ORDER BY o.start_datetime
    `);

    res.json(result.rows);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Unable to retrieve opportunities."
    });
  }
});

app.get("/api/opportunities/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        o.*,
        org.name AS organisation_name,
        COUNT(a.application_id)::INTEGER AS signed
      FROM opportunity o
      JOIN organisation org
        ON o.organisation_id = org.organisation_id
      LEFT JOIN application a
        ON o.opportunity_id = a.opportunity_id
        AND a.status IN ('pending', 'accepted')
      WHERE o.opportunity_id = $1
      GROUP BY
        o.opportunity_id,
        org.name
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Opportunity not found."
      });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Unable to retrieve opportunity."
    });
  }
});

app.post("/api/opportunities", async (req, res) => {
  try {
    const {
      organisation_id,
      title,
      description,
      location,
      start_datetime,
      end_datetime,
      required_volunteers
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO opportunity
      (
        organisation_id,
        title,
        description,
        location,
        start_datetime,
        end_datetime,
        required_volunteers,
        status
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,'open')
      RETURNING *
      `,
      [
        organisation_id,
        title,
        description,
        location,
        start_datetime,
        end_datetime,
        required_volunteers
      ]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Unable to create opportunity."
    });
  }
});

/* =========================================================
   APPLICATIONS
========================================================= */

app.post("/api/applications", async (req, res) => {
  try {
    const {
      volunteer_id,
      opportunity_id
    } = req.body;

    const existing = await pool.query(
      `
      SELECT application_id
      FROM application
      WHERE volunteer_id = $1
      AND opportunity_id = $2
      `,
      [volunteer_id, opportunity_id]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: "You already applied for this opportunity."
      });
    }

    const result = await pool.query(
      `
      INSERT INTO application
      (volunteer_id, opportunity_id, status)
      VALUES ($1, $2, 'pending')
      RETURNING *
      `,
      [volunteer_id, opportunity_id]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Unable to submit application."
    });
  }
});

app.get("/api/applications", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        a.application_id,
        a.volunteer_id,
        vp.first_name,
        vp.last_name,
        a.opportunity_id,
        o.title AS opportunity_title,
        org.name AS organisation_name,
        a.status,
        a.applied_at,
        a.decision_at
      FROM application a
      JOIN volunteer_profile vp
        ON a.volunteer_id = vp.volunteer_id
      JOIN opportunity o
        ON a.opportunity_id = o.opportunity_id
      JOIN organisation org
        ON o.organisation_id = org.organisation_id
      ORDER BY a.applied_at DESC
    `);

    res.json(result.rows);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Unable to retrieve applications."
    });
  }
});

app.get("/api/my-applications/:volunteerId", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        a.application_id,
        o.title,
        o.location,
        o.start_datetime,
        a.status,
        a.applied_at
      FROM application a
      JOIN opportunity o
        ON a.opportunity_id = o.opportunity_id
      WHERE a.volunteer_id = $1
      ORDER BY a.applied_at DESC
      `,
      [req.params.volunteerId]
    );

    res.json(result.rows);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Unable to retrieve applications."
    });
  }
});

app.get(
  "/api/organisation/:organisationId/applications",
  async (req, res) => {
    try {
      const result = await pool.query(
        `
        SELECT
          a.application_id,
          vp.first_name,
          vp.last_name,
          vp.location,
          o.title AS opportunity_title,
          a.status,
          a.applied_at
        FROM application a
        JOIN volunteer_profile vp
          ON a.volunteer_id = vp.volunteer_id
        JOIN opportunity o
          ON a.opportunity_id = o.opportunity_id
        WHERE o.organisation_id = $1
        ORDER BY a.applied_at DESC
        `,
        [req.params.organisationId]
      );

      res.json(result.rows);

    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: "Unable to retrieve organisation applications."
      });
    }
  }
);

app.put("/api/applications/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        error: "Invalid application status."
      });
    }

   const result = await pool.query(
    `
    UPDATE application
    SET
        status = $1::VARCHAR,
        decision_at =
            CASE
                WHEN $1::VARCHAR = 'pending'
                    THEN NULL
                ELSE CURRENT_TIMESTAMP
            END
    WHERE application_id = $2
    RETURNING *
    `,
    [status, req.params.id]
);

    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Unable to update application."
    });
  }
});

/* =========================================================
   PROFILES
========================================================= */

app.get("/api/volunteers/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM volunteer_profile
      WHERE volunteer_id = $1
      `,
      [req.params.id]
    );

    res.json(result.rows[0] || null);

  } catch (error) {
    res.status(500).json({
      error: "Unable to retrieve volunteer profile."
    });
  }
});

app.put("/api/volunteers/:id", async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      phone,
      location,
      availability_summary
    } = req.body;

    const result = await pool.query(
      `
      UPDATE volunteer_profile
      SET
        first_name = $1,
        last_name = $2,
        phone = $3,
        location = $4,
        availability_summary = $5
      WHERE volunteer_id = $6
      RETURNING *
      `,
      [
        first_name,
        last_name,
        phone,
        location,
        availability_summary,
        req.params.id
      ]
    );

    res.json(result.rows[0]);

  } catch (error) {
    res.status(500).json({
      error: "Unable to update volunteer profile."
    });
  }
});

app.get("/api/organisations/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM organisation
      WHERE organisation_id = $1
      `,
      [req.params.id]
    );

    res.json(result.rows[0] || null);

  } catch (error) {
    res.status(500).json({
      error: "Unable to retrieve organisation."
    });
  }
});

/* =========================================================
   DASHBOARD STATISTICS
========================================================= */

app.get("/api/admin/dashboard/:organisationId", async (req, res) => {
  try {
    const id = req.params.organisationId;

    const opportunities = await pool.query(
      `
      SELECT COUNT(*)::INTEGER AS total
      FROM opportunity
      WHERE organisation_id = $1
      `,
      [id]
    );

    const applications = await pool.query(
      `
      SELECT COUNT(*)::INTEGER AS total
      FROM application a
      JOIN opportunity o
        ON a.opportunity_id = o.opportunity_id
      WHERE o.organisation_id = $1
      `,
      [id]
    );

    const accepted = await pool.query(
      `
      SELECT COUNT(*)::INTEGER AS total
      FROM application a
      JOIN opportunity o
        ON a.opportunity_id = o.opportunity_id
      WHERE o.organisation_id = $1
      AND a.status = 'accepted'
      `,
      [id]
    );

    res.json({
      opportunities: opportunities.rows[0].total,
      applications: applications.rows[0].total,
      accepted: accepted.rows[0].total
    });

  } catch (error) {
    res.status(500).json({
      error: "Unable to load dashboard."
    });
  }
});

/* =========================================================
   CHATBOT
========================================================= */

app.post("/api/chatbot", async (req, res) => {
  try {
    const message =
      String(req.body.message || "")
        .toLowerCase()
        .trim();

    if (!message) {
      return res.json({
        reply: "Please type a question."
      });
    }

    const faqResult = await pool.query(
      `
      SELECT question, answer, keywords
      FROM chatbot_faq
      WHERE is_active = TRUE
      `
    );

    const words =
      message
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter(word => word.length > 2);

    let bestMatch = null;
    let bestScore = 0;

    for (const faq of faqResult.rows) {
      const searchable =
        `${faq.question} ${faq.keywords || ""}`
          .toLowerCase();

      let score = 0;

      for (const word of words) {
        if (searchable.includes(word)) {
          score++;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = faq;
      }
    }

    if (bestMatch && bestScore > 0) {
      return res.json({
        reply: bestMatch.answer
      });
    }

    res.json({
      reply:
        "I can help with registration, volunteer opportunities, applications, organisation accounts and using the platform. Please ask a question about one of these topics."
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      reply: "The chatbot is temporarily unavailable."
    });
  }
});

/* =========================================================
   START SERVER
========================================================= */

app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});