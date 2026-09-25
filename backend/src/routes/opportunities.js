import express from "express";
import { query } from "../db.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// GET /api/opportunities?status=open&organisation_id=1
router.get("/", async (req, res, next) => {
  try {
    const { status, organisation_id } = req.query;
    const conditions = [];
    const params = [];
    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }
    if (organisation_id) {
      params.push(organisation_id);
      conditions.push(`organisation_id = $${params.length}`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const { rows } = await query(
      `SELECT * FROM opportunity ${where} ORDER BY start_datetime NULLS LAST`,
      params
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/opportunities/:id
router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT * FROM opportunity WHERE opportunity_id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });

    const skills = await query(
      `SELECT s.skill_id, s.skill_name
         FROM opportunity_skill os
         JOIN skill s ON s.skill_id = os.skill_id
        WHERE os.opportunity_id = $1`,
      [req.params.id]
    );

    res.json({ ...rows[0], skills: skills.rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/opportunities
router.post(
  "/",
  authenticate,
  authorize("organisation_admin", "system_admin"),
  async (req, res, next) => {
    try {
      const {
        organisation_id,
        title,
        description,
        location,
        start_datetime,
        end_datetime,
        required_volunteers,
        skill_ids,
      } = req.body;

      if (!organisation_id || !title) {
        return res.status(400).json({ error: "organisation_id and title required" });
      }

      const { rows } = await query(
        `INSERT INTO opportunity
           (organisation_id, title, description, location,
            start_datetime, end_datetime, required_volunteers)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          organisation_id,
          title,
          description || null,
          location || null,
          start_datetime || null,
          end_datetime || null,
          required_volunteers || null,
        ]
      );

      const opp = rows[0];

      if (Array.isArray(skill_ids) && skill_ids.length) {
        const values = skill_ids.map((_, i) => `($1, $${i + 2})`).join(", ");
        await query(
          `INSERT INTO opportunity_skill (opportunity_id, skill_id)
           VALUES ${values} ON CONFLICT DO NOTHING`,
          [opp.opportunity_id, ...skill_ids]
        );
      }

      res.status(201).json(opp);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/opportunities/:id/status
router.patch(
  "/:id/status",
  authenticate,
  authorize("organisation_admin", "system_admin"),
  async (req, res, next) => {
    try {
      const { status } = req.body;
      const { rows } = await query(
        `UPDATE opportunity SET status = $1
          WHERE opportunity_id = $2 RETURNING *`,
        [status, req.params.id]
      );
      if (!rows.length) return res.status(404).json({ error: "Not found" });
      res.json(rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/opportunities/:id/skills
router.get("/:id/skills", async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT s.skill_id, s.skill_name
         FROM opportunity_skill os
         JOIN skill s ON s.skill_id = os.skill_id
        WHERE os.opportunity_id = $1`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
