-- Add real_estate_agents table for agent directory (separate from platform users)
-- This table stores public-facing real estate agent information

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

-- Create indexes for faster searches
CREATE INDEX IF NOT EXISTS idx_agents_full_name ON real_estate_agents(full_name);
CREATE INDEX IF NOT EXISTS idx_agents_agency_name ON real_estate_agents(agency_name);
CREATE INDEX IF NOT EXISTS idx_agents_active ON real_estate_agents(is_active);
