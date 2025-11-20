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

  if (method !== "GET") {
    return {
      statusCode: 405,
      headers: corsHeaders({ "Allow": "GET,OPTIONS" }),
      body: "Method Not Allowed"
    };
  }

  const authHeader = event.headers.authorization || event.headers.Authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;

  if (!token) {
    return json({ error: "Missing or invalid Authorization header." }, 401);
  }

  let user;
  try {
    user = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.error("JWT verify error:", err);
    return json({ error: "Invalid or expired token." }, 401);
  }

  const params = event.queryStringParameters || {};
  const listingId = params.listing_id ? Number(params.listing_id) : null;
  if (!listingId) {
    return json({ error: "listing_id is required." }, 400);
  }

  const client = createClient();
  await client.connect();

  try {
    // Ensure the listing belongs to this agent (unless admin)
    const listingRes = await client.query(
      "SELECT id, agent_id FROM listings WHERE id = $1",
      [listingId]
    );
    if (listingRes.rows.length === 0) {
      return json({ error: "Listing not found." }, 404);
    }
    const listing = listingRes.rows[0];
    if (user.role !== "admin" && listing.agent_id !== user.sub) {
      return json({ error: "Not authorised to view media for this listing." }, 403);
    }

    const mediaRes = await client.query(
      "SELECT id, url, media_type, sort_order FROM listing_media WHERE listing_id = $1 ORDER BY sort_order ASC, id ASC",
      [listingId]
    );
    return json(mediaRes.rows, 200);
  } catch (err) {
    console.error("Media GET error:", err);
    return json({ error: "Internal server error" }, 500);
  } finally {
    await client.end();
  }
};
