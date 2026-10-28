const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { supabase } = require("../supabase");
const { authenticate } = require("../middleware/authenticate");
const { validEmail, validPassword, validName } = require("../utils/validation");

const router = express.Router();
function createToken(profile) {
  return jwt.sign({ sub: profile.id, email: profile.email }, process.env.JWT_SECRET, { algorithm: "HS256", expiresIn: "2h", issuer: "portfolioforge" });
}
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!validName(name)) return res.status(400).json({ error: "Enter a name with at least 2 characters (maximum 80)." });
  if (!validEmail(email)) return res.status(400).json({ error: "Enter a valid email address." });
  if (!validPassword(password)) return res.status(400).json({ error: "Password must contain 8–72 characters." });
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, 12);
    const { data, error } = await supabase.from("profiles").insert({ name: name.trim(), email: normalizedEmail, password_hash: passwordHash }).select("id,name,email,created_at").single();
    if (error) {
      if (error.code === "23505") return res.status(409).json({ error: "An account with this email already exists. Please log in." });
      console.error("Registration database error:", error.code);
      return res.status(500).json({ error: "Could not create the account. Check that the database schema has been installed." });
    }
    return res.status(201).json({ token: createToken(data), user: { id: data.id, name: data.name, email: data.email } });
  } catch {
    return res.status(500).json({ error: "Could not create the account." });
  }
});
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!validEmail(email) || typeof password !== "string" || !password.length || password.length > 72) return res.status(400).json({ error: "Enter a valid email and password." });
  try {
    const { data, error } = await supabase.from("profiles").select("id,name,email,password_hash").eq("email", email.trim().toLowerCase()).maybeSingle();
    if (error) {
      console.error("Login database error:", error.code);
      return res.status(500).json({ error: "Could not sign in. Check the database setup." });
    }
    if (!data || !(await bcrypt.compare(password, data.password_hash))) return res.status(401).json({ error: "Email or password is incorrect." });
    return res.json({ token: createToken(data), user: { id: data.id, name: data.name, email: data.email } });
  } catch {
    return res.status(500).json({ error: "Could not sign in." });
  }
});
router.get("/me", authenticate, async (req, res) => {
  const { data, error } = await supabase.from("profiles").select("id,name,email").eq("id", req.user.id).maybeSingle();
  if (error || !data) return res.status(401).json({ error: "Account not found. Please log in again." });
  res.json({ user: data });
});
module.exports = router;
