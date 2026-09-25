import express from "express";
import { query } from "../db.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// POST /api/applications  (volunteer applies)
router.post("/", authenticate, authorize("volunteer"), async (req, res, next) => {
  try {
    const { opportunity_id } = req.body;
    if (!opportunity_id) return res.status(400).json({ error: "opportunity_id required" });

    const { rows } = await query(
      `INSERT INTO application (volunteer_id, opportunity_id)
       VALUES ($1, $2) RETURNING *`,
      [req.user.user_id, opportunity_id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Already applied to this opportunity" });
    }
    next(err);
  }
});

// GET /api/applications/me  (volunteer's own applications)
router.get("/me", authenticate, authorize("volunteer"), async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT a.*, o.title, o.location, o.start_datetime, o.end_datetime, o.status AS opportunity_status
         FROM application a
         JOIN opportunity o ON o.opportunity_id = a.opportunity_id
        WHERE a.volunteer_id = $1
        ORDER BY a.applied_at DESC`,
      [req.user.user_id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/applications/opportunity/:opportunityId  (admin view)
router.get(
  "/opportunity/:opportunityId",
  authenticate,
  authorize("organisation_admin", "system_admin"),
  async (req, res, next) => {
    try {
      const { rows } = await query(
        `SELECT a.*, vp.first_name, vp.last_name, vp.location, u.email
           FROM application a
           JOIN volunteer_profile vp ON vp.volunteer_id = a.volunteer_id
           JOIN users u ON u.user_id = vp.volunteer_id
          WHERE a.opportunity_id = $1
          ORDER BY a.applied_at`,
        [req.params.opportunityId]
      );
      res.json(rows);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/applications/:id  { status: 'accepted' | 'rejected' | 'pending' }
router.patch(
  "/:id",
  authenticate,
  authorize("organisation_admin", "system_admin"),
  async (req, res, next) => {
    try {
      const { status } = req.body;
      const valid = ["pending", "accepted", "rejected", "withdrawn"];
      if (!valid.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      const { rows } = await query(
        `UPDATE application
            SET status = $1,
                decision_at = CASE WHEN $1 IN ('accepted','rejected') THEN NOW() ELSE decision_at END
          WHERE application_id = $2
          RETURNING *`,
        [status, req.params.id]
      );
      if (!rows.length) return res.status(404).json({ error: "Not found" });
      res.json(rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/applications/:id  (volunteer withdraws)
router.delete("/:id", authenticate, authorize("volunteer"), async (req, res, next) => {
  try {
    const { rowCount } = await query(
      `DELETE FROM application
        WHERE application_id = $1 AND volunteer_id = $2`,
      [req.params.id, req.user.user_id]
    );
    if (!rowCount) return res.status(404).json({ error: "Not found" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
