import express from "express";
import { query } from "../db.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// GET /api/skills
router.get("/", async (_req, res, next) => {
  try {
    const { rows } = await query(`SELECT * FROM skill ORDER BY skill_name`);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/skills  { skill_name }
router.post("/", authenticate, authorize("system_admin"), async (req, res, next) => {
  try {
    const { skill_name } = req.body;
    if (!skill_name) return res.status(400).json({ error: "skill_name required" });
    const { rows } = await query(
      `INSERT INTO skill (skill_name) VALUES ($1) RETURNING *`,
      [skill_name]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Skill exists" });
    next(err);
  }
});

export default router;
