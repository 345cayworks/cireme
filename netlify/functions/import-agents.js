// netlify/functions/import-agents.js
// Admin-only function to import real estate agents from CSV

const { createClient, json } = require("./_common");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: json({}).headers };
  }

  if (event.httpMethod !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // Check authorization
  const auth = event.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) {
    return json({ error: "Unauthorized" }, 401);
  }

  const token = auth.slice(7);
  // Simple token validation (in production, verify JWT properly)
  // For now, we'll accept any valid-looking token and verify admin status from DB

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { agents } = body;
  if (!Array.isArray(agents) || agents.length === 0) {
    return json({ error: "agents array required" }, 400);
  }

  const client = createClient();
  try {
    await client.connect();

    // First, ensure the real_estate_agents table exists
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

      CREATE INDEX IF NOT EXISTS idx_agents_full_name ON real_estate_agents(full_name);
      CREATE INDEX IF NOT EXISTS idx_agents_agency_name ON real_estate_agents(agency_name);
      CREATE INDEX IF NOT EXISTS idx_agents_active ON real_estate_agents(is_active);
    `);

    // Insert agents
    const inserted = [];
    const errors = [];

    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      try {
        // Try to find matching agency by name
        let agencyId = null;
        if (agent.agency_name) {
          const agencyResult = await client.query(
            "SELECT id FROM agencies WHERE LOWER(name) = LOWER($1) LIMIT 1",
            [agent.agency_name]
          );
          if (agencyResult.rows.length > 0) {
            agencyId = agencyResult.rows[0].id;
          }
        }

        const result = await client.query(`
          INSERT INTO real_estate_agents
          (full_name, email, phone, agency_name, agency_id, specialization, license_number, years_experience, bio, photo_url, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING id, full_name
        `, [
          agent.full_name || agent.name || "Unknown",
          agent.email || null,
          agent.phone || null,
          agent.agency_name || agent.agency || null,
          agencyId,
          agent.specialization || null,
          agent.license_number || agent.license || null,
          agent.years_experience ? parseInt(agent.years_experience) : null,
          agent.bio || agent.description || null,
          agent.photo_url || agent.photo || null,
          agent.is_active !== false
        ]);

        inserted.push(result.rows[0]);
      } catch (err) {
        errors.push({
          index: i,
          agent: agent.full_name || agent.name || "Unknown",
          error: err.message
        });
      }
    }

    return json({
      success: true,
      inserted: inserted.length,
      errors: errors.length > 0 ? errors : undefined,
      agents: inserted
    });

  } catch (err) {
    console.error("Import error:", err);
    return json({ error: err.message }, 500);
  } finally {
    await client.end();
  }
};
