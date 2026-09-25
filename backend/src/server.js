import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import volunteerRoutes from "./routes/volunteers.js";
import organisationRoutes from "./routes/organisations.js";
import opportunityRoutes from "./routes/opportunities.js";
import applicationRoutes from "./routes/applications.js";
import skillRoutes from "./routes/skills.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/volunteers", volunteerRoutes);
app.use("/api/organisations", organisationRoutes);
app.use("/api/opportunities", opportunityRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/skills", skillRoutes);

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));
