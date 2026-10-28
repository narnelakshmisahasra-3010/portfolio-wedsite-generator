require("dotenv").config();
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { supabase } = require("./supabase");
const authRoutes = require("./routes/auth");
const portfolioRoutes = require("./routes/portfolios");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.JWT_SECRET) {
  console.error("Missing required environment variables. Copy backend/.env.example to backend/.env and fill in your Supabase values.");
  process.exit(1);
}
app.disable("x-powered-by");
app.use(helmet({ crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }, contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN || false }));
app.use(express.json({ limit: "100kb" }));
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: "draft-8", legacyHeaders: false }));
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
app.get("/api/health", async (_req, res) => {
  try {
    const { error } = await supabase.from("profiles").select("id").limit(1);
    if (error) throw error;
    res.json({ ok: true, service: "PortfolioForge API", database: "connected" });
  } catch {
    res.status(503).json({ ok: false, service: "PortfolioForge API", database: "unavailable", hint: "Check Supabase URL, key, and database schema." });
  }
});
app.use("/api/auth", authRoutes);
app.use("/api/portfolios", portfolioRoutes);
app.use(express.static(path.join(__dirname, "..", "frontend")));
app.get("/{*path}", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});
app.use((err, _req, res, _next) => {
  if (err && err.type === "entity.parse.failed") return res.status(400).json({ error: "Request body must contain valid JSON." });
  console.error("Request error:", err && err.message ? err.message : "Unknown error");
  res.status(500).json({ error: "An unexpected server error occurred." });
});
app.use((req, res) => res.status(404).json({ error: "Endpoint not found." }));

app.listen(PORT, () => console.log(`PortfolioForge is running at http://localhost:${PORT}`));
