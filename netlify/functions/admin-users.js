const { Client } = require("pg");
const jwt = require("jsonwebtoken");

function createClient() {
  return new Client({
    connectionString: process.env.NEON_DB_URL,
    ssl: { rejectUnauthorized: false }
  });
}

function corsHeaders(extra = {}) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    ...extra
  };
}

function json(payload, statusCode = 200) {
  return {
    statusCode,
    headers: {
      ...corsHeaders(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  };
}

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

exports.handler = async (event) => {
  const method = event.httpMethod;

  if (method === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: ""
    };
  }

  if (method !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders({ "Allow": "POST,OPTIONS" }),
      body: ""
    };
  }

  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return json({ error: "Missing or invalid Authorization header." }, 401);
  }

  const token = authHeader.slice("Bearer ".length).trim();
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.error("JWT verification failed:", err);
    return json({ error: "Invalid or expired token." }, 401);
  }

  if (!decoded || decoded.role !== "admin") {
    return json({ error: "Admin role required." }, 403);
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const action = body.action;

  const client = createClient();
  try {
    await client.connect();

    if (action === "create_agent") {
      const fullName = (body.full_name || "").trim();
      const email = (body.email || "").trim().toLowerCase();
      const phone = (body.phone || "").trim();
      const password = body.password || "";

      if (!fullName || !email || !password) {
        return json({ error: "full_name, email, and password are required." }, 400);
      }

      const res = await client.query(
        `INSERT INTO users (agency_id, role, full_name, email, password_hash, phone)
         VALUES (NULL, 'agent', $1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE
         SET full_name = EXCLUDED.full_name,
             phone = EXCLUDED.phone,
             password_hash = EXCLUDED.password_hash
         RETURNING id, full_name, email, phone, role`,
        [fullName, email, password, phone || null]
      );

      const user = res.rows[0];
      return json({
        success: true,
        message: "Agent created/updated successfully.",
        user
      });
    }

    if (action === "reset_password") {
      const email = (body.email || "").trim().toLowerCase();
      const newPassword = body.new_password || "";

      if (!email || !newPassword) {
        return json({ error: "email and new_password are required." }, 400);
      }

      const res = await client.query(
        `UPDATE users
         SET password_hash = $1
         WHERE email = $2
         RETURNING id, full_name, email, role`,
        [newPassword, email]
      );

      if (res.rowCount === 0) {
        return json({ error: "User not found." }, 404);
      }

      const user = res.rows[0];
      return json({
        success: true,
        message: "Password updated successfully.",
        user
      });
    }

    return json({ error: "Unsupported action." }, 400);
  } catch (err) {
    console.error("Admin-users error:", err);
    return json({ error: "Internal admin-users error." }, 500);
  } finally {
    await client.end();
  }
};
