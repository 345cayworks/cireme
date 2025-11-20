const { Client } = require("pg");

const connectionString = process.env.NEON_DB_URL;

if (!connectionString) {
  console.error("❌ NEON_DB_URL environment variable is not set.");
  process.exit(1);
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS agencies (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo_url TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  agency_id INTEGER REFERENCES agencies(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','agent','valuator','bank_agent','advertiser','subscriber')),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS listings (
  id SERIAL PRIMARY KEY,
  agency_id INTEGER REFERENCES agencies(id) ON DELETE SET NULL,
  agent_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  mls_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  property_type TEXT NOT NULL,
  district TEXT NOT NULL,
  address TEXT,
  parcel_id TEXT,
  list_price NUMERIC(14,2) NOT NULL,
  bedrooms INTEGER,
  bathrooms NUMERIC(4,1),
  square_feet INTEGER,
  lot_size NUMERIC(10,2),
  year_built INTEGER,
  headline TEXT,
  description TEXT,
  list_date DATE DEFAULT CURRENT_DATE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS listing_media (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'photo',
  sort_order INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rppi_indexes (
  id SERIAL PRIMARY KEY,
  district TEXT NOT NULL,
  year INTEGER NOT NULL,
  index_value NUMERIC(10,4) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(district, year)
);
`;

async function ensureSchema(client) {
  console.log("🛠 Ensuring schema exists...");
  await client.query(SCHEMA_SQL);
  console.log("✅ Base tables ensured (agencies, users, listings, listing_media, rppi_indexes).");
}

async function maybeSeed(client) {
  const { rows } = await client.query("SELECT COUNT(*)::int AS count FROM listings");
  const count = rows[0].count;
  if (count > 0) {
    console.log(`ℹ️ listings table already has ${count} row(s). Skipping seed.`);
    return;
  }

  console.log("🌱 Seeding sample data into agencies, users, and listings...");
  const seedSql = `
    INSERT INTO agencies (name, slug, logo_url, phone, email, website, address)
    VALUES
    ('Island Realty Group', 'island-realty', NULL, '+1 (345) 555-1010', 'info@islandrealty.ky', 'https://islandrealty.ky', 'Harbour Drive, George Town'),
    ('Cayman Luxury Estates', 'cayman-luxury', NULL, '+1 (345) 555-2020', 'office@luxurycayman.com', 'https://luxurycayman.com', 'West Bay Road, SMB')
    ON CONFLICT (slug) DO NOTHING;

    INSERT INTO users (agency_id, role, full_name, email, password_hash, phone)
    VALUES (
      (SELECT id FROM agencies WHERE slug = 'island-realty' LIMIT 1),
      'agent',
      'Sarah Thompson',
      'sarah@islandrealty.ky',
      'test1234',
      '+1 (345) 555-1111'
    )
    ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name;

    INSERT INTO users (agency_id, role, full_name, email, password_hash, phone)
    VALUES (
      (SELECT id FROM agencies WHERE slug = 'island-realty' LIMIT 1),
      'admin',
      'System Admin',
      'admin@cireme.local',
      'admin1234',
      '+1 (345) 555-0000'
    )
    ON CONFLICT (email) DO NOTHING;

    INSERT INTO listings (
      agency_id, agent_id, status, property_type, district,
      address, parcel_id, list_price, bedrooms, bathrooms,
      square_feet, lot_size, year_built, headline, description, published_at
    )
    VALUES
    ((SELECT id FROM agencies WHERE slug = 'island-realty' LIMIT 1),
     (SELECT id FROM users WHERE email = 'sarah@islandrealty.ky' LIMIT 1),
     'active', 'condo', 'George Town',
     'Britannia Drive, George Town', '14D345', 595000, 2, 2, 1250, NULL, 2012,
     'Modern 2-Bedroom Condo in George Town',
     'A beautifully upgraded condo located minutes from Camana Bay with pool access and canal views.',
     NOW()
    )
    ON CONFLICT DO NOTHING;

    -- Seed core CIREME admin and agent accounts (plain-text passwords for prototype)
    INSERT INTO users (agency_id, role, full_name, email, password_hash, phone)
    VALUES (
      NULL,
      'admin',
      'CIREME Platform Admin',
      'admin@cireme.ky',
      'CiremeAdmin2025!',
      '+1 (345) 000-0000'
    )
    ON CONFLICT (email) DO NOTHING;

    INSERT INTO users (agency_id, role, full_name, email, password_hash, phone)
    VALUES (
      NULL,
      'agent',
      'CIREME Test Agent',
      'agent@cireme.ky',
      'CiremeAgent2025!',
      '+1 (345) 000-0001'
    )
    ON CONFLICT (email) DO NOTHING;
  `;
  await client.query(seedSql);
  console.log("✅ Sample data seeded.");
}

async function seedRPPIData(client) {
  const { rows } = await client.query("SELECT COUNT(*)::int AS count FROM rppi_indexes");
  const count = rows[0].count;
  if (count > 0) {
    console.log(`ℹ️ rppi_indexes table already has ${count} row(s). Skipping RPPI seed.`);
    return;
  }

  console.log("🌱 Seeding RPPI index data for Cayman Islands districts...");

  // Seed historical RPPI data for major Cayman districts (2015-2024)
  // Index values are sample data showing realistic growth patterns
  const rppiSql = `
    INSERT INTO rppi_indexes (district, year, index_value) VALUES
    -- George Town (steady growth, commercial hub)
    ('George Town', 2015, 100.0000),
    ('George Town', 2016, 103.2000),
    ('George Town', 2017, 106.8000),
    ('George Town', 2018, 110.5000),
    ('George Town', 2019, 114.8000),
    ('George Town', 2020, 116.2000),
    ('George Town', 2021, 121.5000),
    ('George Town', 2022, 128.3000),
    ('George Town', 2023, 134.7000),
    ('George Town', 2024, 140.2000),

    -- Seven Mile Beach (premium area, strong growth)
    ('Seven Mile Beach', 2015, 100.0000),
    ('Seven Mile Beach', 2016, 105.5000),
    ('Seven Mile Beach', 2017, 111.2000),
    ('Seven Mile Beach', 2018, 117.8000),
    ('Seven Mile Beach', 2019, 124.5000),
    ('Seven Mile Beach', 2020, 127.3000),
    ('Seven Mile Beach', 2021, 135.8000),
    ('Seven Mile Beach', 2022, 145.2000),
    ('Seven Mile Beach', 2023, 154.8000),
    ('Seven Mile Beach', 2024, 163.5000),

    -- West Bay (moderate growth)
    ('West Bay', 2015, 100.0000),
    ('West Bay', 2016, 102.8000),
    ('West Bay', 2017, 105.9000),
    ('West Bay', 2018, 109.2000),
    ('West Bay', 2019, 112.8000),
    ('West Bay', 2020, 114.5000),
    ('West Bay', 2021, 119.2000),
    ('West Bay', 2022, 124.8000),
    ('West Bay', 2023, 130.5000),
    ('West Bay', 2024, 135.8000),

    -- Bodden Town (emerging growth area)
    ('Bodden Town', 2015, 100.0000),
    ('Bodden Town', 2016, 102.5000),
    ('Bodden Town', 2017, 105.2000),
    ('Bodden Town', 2018, 108.1000),
    ('Bodden Town', 2019, 111.3000),
    ('Bodden Town', 2020, 113.0000),
    ('Bodden Town', 2021, 117.5000),
    ('Bodden Town', 2022, 122.8000),
    ('Bodden Town', 2023, 128.4000),
    ('Bodden Town', 2024, 133.6000),

    -- North Side (slower growth, residential)
    ('North Side', 2015, 100.0000),
    ('North Side', 2016, 101.8000),
    ('North Side', 2017, 103.9000),
    ('North Side', 2018, 106.2000),
    ('North Side', 2019, 108.7000),
    ('North Side', 2020, 109.8000),
    ('North Side', 2021, 113.2000),
    ('North Side', 2022, 117.5000),
    ('North Side', 2023, 121.9000),
    ('North Side', 2024, 126.1000),

    -- East End (steady moderate growth)
    ('East End', 2015, 100.0000),
    ('East End', 2016, 102.2000),
    ('East End', 2017, 104.6000),
    ('East End', 2018, 107.3000),
    ('East End', 2019, 110.1000),
    ('East End', 2020, 111.5000),
    ('East End', 2021, 115.8000),
    ('East End', 2022, 120.7000),
    ('East End', 2023, 125.8000),
    ('East End', 2024, 130.5000)
    ON CONFLICT (district, year) DO NOTHING;
  `;

  await client.query(rppiSql);
  console.log("✅ RPPI index data seeded for 6 districts (2015-2024).");
}

async function main() {
  console.log("🔗 Connecting to database...");
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("✅ Connected to Neon.");

    await ensureSchema(client);
    await maybeSeed(client);
    await seedRPPIData(client);

    console.log("🎉 Database check / setup complete.");
  } catch (err) {
    console.error("❌ Error during DB init:", err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
