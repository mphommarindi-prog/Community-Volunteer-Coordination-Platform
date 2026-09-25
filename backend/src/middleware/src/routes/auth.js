import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { query } from "../db.js";

dotenv.config();
const router = express.Router();

// POST /api/auth/register
router.post("/register", async (req, res, next) => {
  try {
    const { email, password, role, first_name, last_name, phone, location } =
      req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: "email, password, role required" });
    }

    const allowed = ["volunteer", "organisation_admin", "system_admin"];
    if (!allowed.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const hash = await bcrypt.hash(password, 10);

    const { rows } = await query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING user_id, email, role, is_active, created_at`,
      [email, hash, role]
    );

    const user = rows[0];

    // Create volunteer profile if role = volunteer
    if (role === "volunteer") {
      await query(
        `INSERT INTO volunteer_profile
           (volunteer_id, first_name, last_name, phone, location)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.user_id, first_name || "", last_name || "", phone || null, location || null]
      );
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.status(201).json({ user, token });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Email already registered" });
    }
    next(err);
  }
});

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { rows } = await query(
      `SELECT user_id, email, password_hash, role, is_active
         FROM users WHERE email = $1`,
      [email]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const user = rows[0];
    if (!user.is_active) {
      return res.status(403).json({ error: "Account disabled" });
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.json({
      user: {
        user_id: user.user_id,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
