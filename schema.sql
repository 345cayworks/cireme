-- CIREME MLS core schema (with listing_media for photos)

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
