const { createClient, corsHeaders, json } = require("./_common");
const jwt = require("jsonwebtoken");

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
      body: "Method Not Allowed"
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const action = body.action || "login";

  if (action === "login") {
    return handleLogin(body);
  }

  return json({ error: "Unsupported action" }, 400);
};

async function handleLogin(body) {
  const { email, password } = body;

  if (!email || !password) {
    return json({ error: "Email and password are required." }, 400);
  }

  const client = createClient();
  await client.connect();

  try {
    const res = await client.query(
      `SELECT id, agency_id, full_name, email, role, password_hash
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [email]
    );

    if (res.rows.length === 0) {
      return json({ error: "Invalid credentials." }, 401);
    }

    const user = res.rows[0];

    // Prototype only – compare as plain text.
    if (user.password_hash !== password) {
      return json({ error: "Invalid credentials." }, 401);
    }

    if (!["agent","admin"].includes(user.role)) {
      return json({ error: "User is not authorised for dashboard access." }, 403);
    }

    const token = jwt.sign(
      {
        sub: user.id,
        role: user.role,
        agency_id: user.agency_id,
        full_name: user.full_name,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    return json({
      token,
      agentName: user.full_name,
      role: user.role
    });
  } catch (err) {
    console.error("Auth error:", err);
    return json({ error: "Internal auth error." }, 500);
  } finally {
    await client.end();
  }
}
