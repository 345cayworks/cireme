#!/usr/bin/env node
/**
 * CSV Agent Import Utility
 *
 * This script helps import real estate agents from a CSV file to the database.
 *
 * Usage:
 *   node scripts/importAgentsFromCSV.js <path-to-csv-file>
 *
 * CSV Format:
 *   The CSV should have headers. Supported columns:
 *   - full_name or name (required)
 *   - email
 *   - phone
 *   - agency_name or agency
 *   - specialization
 *   - license_number or license
 *   - years_experience
 *   - bio or description
 *   - photo_url or photo
 *   - is_active (true/false, defaults to true)
 *
 * Example:
 *   node scripts/importAgentsFromCSV.js agents.csv
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Parse CSV (simple parser, no external dependencies)
function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV file must have headers and at least one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || null;
    });
    rows.push(row);
  }

  return rows;
}

// Map CSV row to agent object
function mapRowToAgent(row) {
  return {
    full_name: row.full_name || row.name || row.Full_Name || row.Name,
    email: row.email || row.Email,
    phone: row.phone || row.Phone,
    agency_name: row.agency_name || row.agency || row.Agency || row.Agency_Name,
    specialization: row.specialization || row.Specialization,
    license_number: row.license_number || row.license || row.License || row.License_Number,
    years_experience: row.years_experience || row.experience || row.Experience || row.Years_Experience,
    bio: row.bio || row.description || row.Bio || row.Description,
    photo_url: row.photo_url || row.photo || row.Photo || row.Photo_URL,
    is_active: row.is_active === 'false' || row.is_active === '0' ? false : true
  };
}

async function importAgents(csvFilePath) {
  // Check if file exists
  if (!fs.existsSync(csvFilePath)) {
    throw new Error(`CSV file not found: ${csvFilePath}`);
  }

  // Read and parse CSV
  console.log(`📖 Reading CSV file: ${csvFilePath}`);
  const content = fs.readFileSync(csvFilePath, 'utf-8');
  const rows = parseCSV(content);
  console.log(`✅ Parsed ${rows.length} agents from CSV`);

  // Map to agent objects
  const agents = rows.map(mapRowToAgent);

  // Connect to database
  const connectionString = process.env.NEON_DB_URL;
  if (!connectionString) {
    throw new Error('NEON_DB_URL environment variable is not set');
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔗 Connected to database');

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

      CREATE INDEX IF NOT EXISTS idx_agents_full_name ON real_estate_agents(full_name);
      CREATE INDEX IF NOT EXISTS idx_agents_agency_name ON real_estate_agents(agency_name);
      CREATE INDEX IF NOT EXISTS idx_agents_active ON real_estate_agents(is_active);
    `);
    console.log('✅ Database table ready');

    // Insert agents
    let inserted = 0;
    let skipped = 0;
    const errors = [];

    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];

      if (!agent.full_name) {
        console.log(`⚠️  Skipping row ${i + 1}: missing name`);
        skipped++;
        continue;
      }

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

        await client.query(`
          INSERT INTO real_estate_agents
          (full_name, email, phone, agency_name, agency_id, specialization, license_number, years_experience, bio, photo_url, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          agent.full_name,
          agent.email,
          agent.phone,
          agent.agency_name,
          agencyId,
          agent.specialization,
          agent.license_number,
          agent.years_experience ? parseInt(agent.years_experience) : null,
          agent.bio,
          agent.photo_url,
          agent.is_active
        ]);

        inserted++;
        console.log(`✓ Imported: ${agent.full_name}`);
      } catch (err) {
        console.error(`✗ Error importing ${agent.full_name}:`, err.message);
        errors.push({ agent: agent.full_name, error: err.message });
      }
    }

    console.log('\n📊 Import Summary:');
    console.log(`   Total rows: ${rows.length}`);
    console.log(`   ✅ Imported: ${inserted}`);
    if (skipped > 0) console.log(`   ⚠️  Skipped: ${skipped}`);
    if (errors.length > 0) console.log(`   ❌ Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(({ agent, error }) => {
        console.log(`   - ${agent}: ${error}`);
      });
    }

  } catch (err) {
    console.error('❌ Database error:', err.message);
    throw err;
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Main
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('❌ Usage: node scripts/importAgentsFromCSV.js <path-to-csv-file>');
  process.exit(1);
}

const csvFilePath = path.resolve(args[0]);

importAgents(csvFilePath)
  .then(() => {
    console.log('🎉 Import complete!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Import failed:', err.message);
    process.exit(1);
  });
