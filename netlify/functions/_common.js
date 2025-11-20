const { Client } = require("pg");
const jwt = require("jsonwebtoken");

const ALLOWED_ORIGINS = (process.env.CORS_ALLOWLIST || "")
  .split(",").map(s => s.trim()).filter(Boolean);

function corsHeaders(extra = {}) {
  const origin = ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS[0] : "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    ...extra
  };
}

function json(payload, statusCode = 200) {
  return { statusCode, headers: { ...corsHeaders(), "Content-Type": "application/json" }, body: JSON.stringify(payload) };
}

function createClient() {
  return new Client({ connectionString: process.env.NEON_DB_URL, ssl: { rejectUnauthorized: false } });
}

function getJwtSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET not configured");
  return s;
}

function requireJWT(event) {
  const auth = event.headers?.authorization || event.headers?.Authorization || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) throw Object.assign(new Error("Missing bearer token"), { statusCode: 401 });
  try { return jwt.verify(m[1], getJwtSecret()); }
  catch { throw Object.assign(new Error("Invalid token"), { statusCode: 401 }); }
}

function role(c){ return (c?.role || "").toLowerCase(); }

function parseNum(v, { min = null, max = null, integer = false } = {}) {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  if (Number.isNaN(n)) throw Object.assign(new Error(`Invalid number: ${v}`), { statusCode: 400 });
  if (integer && !Number.isInteger(n)) throw Object.assign(new Error(`Expected integer: ${v}`), { statusCode: 400 });
  if (min !== null && n < min) throw Object.assign(new Error(`Value < min: ${v}`), { statusCode: 400 });
  if (max !== null && n > max) throw Object.assign(new Error(`Value > max: ${v}`), { statusCode: 400 });
  return n;
}

module.exports = { createClient, corsHeaders, json, requireJWT, role, parseNum };
