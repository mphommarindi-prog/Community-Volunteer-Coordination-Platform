import express from "express";
import { query } from "../db.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// POST /api/organisations  (create — system_admin only for now)
router.post("/", authenticate, authorize("system_admin"), async (req, res, next) => {
  try {
    const { name, email, phone, address } = req.body;
    const { rows } = await query(
      `INSERT INTO organisation (name, email, phone, address)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, email, phone || null, address || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Email already in use" });
    next(err);
  }
});

// GET /api/organisations
router.get("/", async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT * FROM organisation ORDER BY name`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/organisations/:id
router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT * FROM organisation WHERE organisation_id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/organisations/:id/members
router.post(
  "/:id/members",
  authenticate,
  authorize("organisation_admin", "system_admin"),
  async (req, res, next) => {
    try {
      const { user_id, member_role } = req.body;
      const { rows } = await query(
        `INSERT INTO organisation_member (organisation_id, user_id, member_role)
         VALUES ($1, $2, $3) RETURNING *`,
        [req.params.id, user_id, member_role || null]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/organisations/:id/members
router.get("/:id/members", async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT om.user_id, om.member_role, u.email, u.role
         FROM organisation_member om
         JOIN users u ON u.user_id = om.user_id
        WHERE om.organisation_id = $1`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
