CREATE TABLE IF NOT EXISTS partner_applications (
  id           bigserial PRIMARY KEY,
  org_name     text NOT NULL,
  contact_name text NOT NULL,
  email        text NOT NULL,
  phone        text,
  message      text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  ip           text
);
CREATE INDEX IF NOT EXISTS idx_partner_apps_email_created ON partner_applications(email, created_at DESC);

-- api_hits is referenced by public rate limiter; create if missing
CREATE TABLE IF NOT EXISTS api_hits (
  id        bigserial PRIMARY KEY,
  agent_id  text NOT NULL,
  func      text NOT NULL,
  ip        text,
  ts        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_api_hits_agent_func_ts ON api_hits(agent_id, func, ts DESC);
