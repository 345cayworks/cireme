-- Sample agencies, users (agent), and listings for CIREME MLS

INSERT INTO agencies (name, slug, logo_url, phone, email, website, address)
VALUES
('Island Realty Group', 'island-realty', NULL, '+1 (345) 555-1010', 'info@islandrealty.ky', 'https://islandrealty.ky', 'Harbour Drive, George Town'),
('Cayman Luxury Estates', 'cayman-luxury', NULL, '+1 (345) 555-2020', 'office@luxurycayman.com', 'https://luxurycayman.com', 'West Bay Road, SMB')
ON CONFLICT (slug) DO NOTHING;

-- Agent with plain-text password for prototype login
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

-- Example admin user (you can change the email/password later)
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

-- Sample listing
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
