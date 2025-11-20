
// Updated upload-image.js with verbose Cloudinary error output
const { createClient, corsHeaders, json } = require("./_common");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET;

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders(), body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: corsHeaders(), body: "Method Not Allowed" };
  }

  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    return json({ error: "Cloudinary not configured" }, 500);
  }

  const authHeader = event.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
  if (!token) return json({ error: "Missing token" }, 401);

  let user;
  try {
    user = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return json({ error: "Invalid token" }, 401);
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json({ error: "Bad JSON" }, 400);
  }

  const { listing_id, content_type, data } = body;
  if (!listing_id || !data) return json({ error: "Missing fields" }, 400);

  const client = createClient();
  await client.connect();

  try {
    const listingRes = await client.query(
      "SELECT id, agent_id FROM listings WHERE id=$1",
      [listing_id]
    );
    if (listingRes.rows.length === 0) return json({ error: "Listing not found" }, 404);
    if (user.role !== "admin" && listingRes.rows[0].agent_id !== user.sub)
      return json({ error: "Forbidden" }, 403);

    const fileDataUrl = `data:${content_type};base64,${data}`;

    // Build form body manually to avoid URL encoding issues with large base64 strings
    const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2)}`;
    const formBody = [
      `--${boundary}`,
      `Content-Disposition: form-data; name="upload_preset"`,
      ``,
      UPLOAD_PRESET,
      `--${boundary}`,
      `Content-Disposition: form-data; name="file"`,
      ``,
      fileDataUrl,
      `--${boundary}--`
    ].join('\r\n');

    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`
      },
      body: formBody
    });

    let text = await resp.text();
    let cloudResp;
    try { cloudResp = JSON.parse(text); } catch { cloudResp = { raw: text }; }

    if (!resp.ok) return json({ error: "Cloudinary upload failed", detail: cloudResp }, 500);

    const secureUrl = cloudResp.secure_url;
    const sortRes = await client.query(
      "SELECT COALESCE(MAX(sort_order),0)+1 AS next_sort FROM listing_media WHERE listing_id=$1",
      [listing_id]
    );
    const nextSort = sortRes.rows[0].next_sort;

    const insertRes = await client.query(
      "INSERT INTO listing_media (listing_id,url,media_type,sort_order) VALUES ($1,$2,'photo',$3) RETURNING *",
      [listing_id, secureUrl, nextSort]
    );

    return json({ success: true, media: insertRes.rows[0] }, 201);

  } catch (err) {
    return json({ error: "Internal error", detail: err.message }, 500);
  } finally {
    await client.end();
  }
};
