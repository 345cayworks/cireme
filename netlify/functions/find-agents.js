// netlify/functions/find-agents.js
// Public function to search real estate agents by name or agency

const { createClient, json } = require("./_common");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: json({}).headers };
  }

  if (event.httpMethod !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  const params = event.queryStringParameters || {};
  const { search, agency, limit = "50", offset = "0" } = params;

  const client = createClient();
  try {
    await client.connect();

    // Ensure table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS real_estate_agents (
        id SERIAL PRIMARY KEY,
        full_name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        agency_name TEXT,
        agency_id INTEGER REFERENCES agencies(id) ON DELETE SET NULL,
        specialization TEXT,
        license_number TEXT,
        years_experience INTEGER,
        bio TEXT,
        photo_url TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Build query based on search parameters
    let query = `
      SELECT
        id, full_name, email, phone, agency_name,
        specialization, license_number, years_experience,
        bio, photo_url
      FROM real_estate_agents
      WHERE is_active = true
    `;
    const values = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (
        LOWER(full_name) LIKE LOWER($${paramIndex}) OR
        LOWER(agency_name) LIKE LOWER($${paramIndex})
      )`;
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (agency) {
      query += ` AND LOWER(agency_name) LIKE LOWER($${paramIndex})`;
      values.push(`%${agency}%`);
      paramIndex++;
    }

    query += ` ORDER BY full_name ASC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(parseInt(limit), parseInt(offset));

    const result = await client.query(query, values);

    // Also get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM real_estate_agents WHERE is_active = true`;
    const countValues = [];
    let countParamIndex = 1;

    if (search) {
      countQuery += ` AND (
        LOWER(full_name) LIKE LOWER($${countParamIndex}) OR
        LOWER(agency_name) LIKE LOWER($${countParamIndex})
      )`;
      countValues.push(`%${search}%`);
      countParamIndex++;
    }

    if (agency) {
      countQuery += ` AND LOWER(agency_name) LIKE LOWER($${countParamIndex})`;
      countValues.push(`%${agency}%`);
      countParamIndex++;
    }

    const countResult = await client.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].total);

    return json({
      agents: result.rows,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (err) {
    console.error("Search error:", err);
    return json({ error: err.message }, 500);
  } finally {
    await client.end();
  }
};
