const express = require("express");
const { supabase } = require("../supabase");
const { authenticate } = require("../middleware/authenticate");
const { validPortfolioContent } = require("../utils/validation");

const router = express.Router();
router.use(authenticate);

router.get("/", async (req, res) => {
  const { data, error } = await supabase.from("portfolios").select("id,title,content,created_at,updated_at").eq("user_id", req.user.id).order("updated_at", { ascending: false });
  if (error) {
    console.error("Portfolio list error:", error.code);
    return res.status(500).json({ error: "Could not load portfolios." });
  }
  res.json({ portfolios: data });
});
router.post("/", async (req, res) => {
  const content = req.body && req.body.content;
  const validationError = validPortfolioContent(content);
  if (validationError) return res.status(400).json({ error: validationError });
  const title = (content.title || "My Portfolio").trim() || "My Portfolio";
  const { data, error } = await supabase.from("portfolios").insert({ user_id: req.user.id, title, content }).select("id,title,content,created_at,updated_at").single();
  if (error) {
    console.error("Portfolio create error:", error.code);
    return res.status(500).json({ error: "Could not save this portfolio." });
  }
  res.status(201).json({ portfolio: data });
});
router.put("/:id", async (req, res) => {
  const content = req.body && req.body.content;
  const validationError = validPortfolioContent(content);
  if (validationError) return res.status(400).json({ error: validationError });
  const title = (content.title || "My Portfolio").trim() || "My Portfolio";
  const { data, error } = await supabase.from("portfolios").update({ title, content, updated_at: new Date().toISOString() }).eq("id", req.params.id).eq("user_id", req.user.id).select("id,title,content,created_at,updated_at").maybeSingle();
  if (error) {
    console.error("Portfolio update error:", error.code);
    return res.status(500).json({ error: "Could not update this portfolio." });
  }
  if (!data) return res.status(404).json({ error: "Portfolio not found in your account." });
  res.json({ portfolio: data });
});
router.delete("/:id", async (req, res) => {
  const { data, error } = await supabase.from("portfolios").delete().eq("id", req.params.id).eq("user_id", req.user.id).select("id").maybeSingle();
  if (error) {
    console.error("Portfolio delete error:", error.code);
    return res.status(500).json({ error: "Could not delete this portfolio." });
  }
  if (!data) return res.status(404).json({ error: "Portfolio not found in your account." });
  res.json({ message: "Portfolio deleted." });
});
module.exports = router;
