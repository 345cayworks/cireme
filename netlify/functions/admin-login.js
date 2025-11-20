// netlify/functions/admin-login.js
// POST { email, password } -> { token } if matches env ADMIN_EMAIL/ADMIN_PASSWORD.
// Token carries role=admin, 24h expiry.
const { json, corsHeaders } = require("./_common");
const jwt = require("jsonwebtoken");

const REQUIRED = ["JWT_SECRET", "ADMIN_EMAIL", "ADMIN_PASSWORD"];

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: corsHeaders(), body: "" };
  if (event.httpMethod !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    for (const k of REQUIRED) if (!process.env[k]) return json({ error: `Server not configured: ${k}` }, 500);
    const body = JSON.parse(event.body || "{}");
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!email || !password) return json({ error: "Email and password required" }, 400);

    if (email !== process.env.ADMIN_EMAIL.toLowerCase() || password !== process.env.ADMIN_PASSWORD) {
      return json({ error: "Invalid credentials" }, 401);
    }

    const now = Math.floor(Date.now() / 1000);
    const token = jwt.sign(
      {
        sub: email,
        role: "admin",
        iat: now,
        exp: now + 60 * 60 * 24, // 24h
      },
      process.env.JWT_SECRET
    );
    return json({ token });
  } catch (e) {
    console.error("admin-login error", e);
    return json({ error: "Internal server error" }, 500);
  }
};
