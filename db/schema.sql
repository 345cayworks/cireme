CREATE TABLE IF NOT EXISTS agents (
  id         text PRIMARY KEY,
  name       text NOT NULL,
  email      text NOT NULL,
  api_key    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS listings (
  id         text PRIMARY KEY,
  title      text NOT NULL,
  price      numeric,
  beds       integer,
  baths      integer,
  sqft       integer,
  type       text,
  district   text,
  lat        double precision,
  lng        double precision,
  images     text[],
  agent_id   text REFERENCES agents(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS leads (
  id         bigserial PRIMARY KEY,
  listing_id text NOT NULL,
  name       text NOT NULL,
  email      text NOT NULL,
  phone      text,
  message    text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_listings_agent ON listings(agent_id);
CREATE INDEX IF NOT EXISTS idx_leads_listing ON leads(listing_id);
