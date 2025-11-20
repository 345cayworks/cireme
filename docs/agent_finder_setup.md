# Agent Finder Feature - Setup Guide

## Overview

The Agent Finder feature allows users to search and browse a directory of real estate agents in the Cayman Islands. This is separate from the platform's user authentication system - these are public-facing agent profiles that anyone can search.

## Components Created

### 1. Database Schema
- **Table**: `real_estate_agents`
- **Location**: `/scripts/add_agents_table.sql`
- Stores agent information separate from the `users` table
- Fields: name, email, phone, agency, specialization, license, experience, bio, photo

### 2. Backend Functions

#### `/netlify/functions/find-agents.js`
Public API endpoint for searching agents.
- **Method**: GET
- **Query params**:
  - `search` - searches in agent name or agency name
  - `agency` - filters by agency name
  - `limit` - results per page (default: 50)
  - `offset` - pagination offset (default: 0)
- **Response**: JSON with agents array and pagination info

#### `/netlify/functions/import-agents.js`
Admin-only API for bulk importing agents.
- **Method**: POST
- **Body**: `{ "agents": [...] }`
- **Auth**: Requires Bearer token
- Used by the import script

### 3. Frontend

#### `/find-agent.html`
Public-facing search page with:
- Search by agent name
- Search by agency name
- Responsive card grid layout
- Agent contact information
- Photo placeholders with initials

### 4. Import Utility

#### `/scripts/importAgentsFromCSV.js`
Node.js script to import agents from CSV.

**Usage:**
```bash
node scripts/importAgentsFromCSV.js agents.csv
```

**CSV Format:**
The CSV should have headers. Supported columns (case-insensitive):
- `full_name` or `name` (required)
- `email`
- `phone`
- `agency_name` or `agency`
- `specialization`
- `license_number` or `license`
- `years_experience`
- `bio` or `description`
- `photo_url` or `photo`
- `is_active` (true/false, defaults to true)

**Example CSV:**
```csv
full_name,email,phone,agency_name,specialization,years_experience
John Smith,john@realty.ky,+1-345-555-1234,Island Realty,Residential Sales,15
Jane Doe,jane@luxury.com,+1-345-555-5678,Cayman Luxury Estates,Waterfront Properties,8
```

## Setup Instructions

### Step 1: Prepare Your CSV File

1. Place your CSV file with 99 agents in the project directory
2. Ensure it has proper headers (see format above)
3. Verify data quality (emails, phone numbers, etc.)

### Step 2: Run the Import

```bash
# Make sure NEON_DB_URL is set in your environment
export NEON_DB_URL="your-connection-string"

# Run the import script
node scripts/importAgentsFromCSV.js path/to/your/agents.csv
```

The script will:
- Create the `real_estate_agents` table if it doesn't exist
- Parse the CSV file
- Match agencies with existing records in the `agencies` table
- Insert all agents into the database
- Display a summary of successful imports and any errors

### Step 3: Test the Feature

1. Start the Netlify dev server:
   ```bash
   netlify dev
   ```

2. Navigate to: `http://localhost:8888/find-agent.html`

3. Test searching by:
   - Agent name
   - Agency name
   - Both fields
   - Empty search (shows all agents)

### Step 4: Deploy

Once tested locally, commit your changes and deploy to Netlify:
```bash
git add .
git commit -m "Add agent finder feature"
git push
```

## Integration with Navigation

The "Find an Agent" link has been added to the Tools dropdown menu in the main navigation on `index.html`. This makes it easily accessible from the homepage.

## API Documentation

### GET /find-agents

Search for real estate agents.

**Query Parameters:**
- `search` (optional): Search term for agent or agency name
- `agency` (optional): Filter by agency name
- `limit` (optional): Number of results (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "agents": [
    {
      "id": 1,
      "full_name": "John Smith",
      "email": "john@realty.ky",
      "phone": "+1-345-555-1234",
      "agency_name": "Island Realty",
      "specialization": "Residential Sales",
      "license_number": "RE-12345",
      "years_experience": 15,
      "bio": "Experienced agent specializing in...",
      "photo_url": null
    }
  ],
  "total": 99,
  "limit": 50,
  "offset": 0
}
```

### POST /import-agents

Admin-only endpoint for bulk importing agents (used by the script).

## Database Schema

```sql
CREATE TABLE real_estate_agents (
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
```

## Notes

- Agents in this table are **separate** from platform users in the `users` table
- Platform users (role='agent') can log in and manage listings
- Real estate agents in this directory are public-facing profiles for discovery
- If an agency name matches an existing agency in the `agencies` table, the foreign key relationship is automatically created
- Inactive agents can be hidden by setting `is_active = false`

## Future Enhancements

Potential improvements:
- Agent detail pages with full profile
- Direct messaging/contact form
- Agent ratings and reviews
- Property listing counts per agent
- Advanced filters (specialization, experience level, district)
- Photo upload interface for agents
- Integration with platform user accounts
