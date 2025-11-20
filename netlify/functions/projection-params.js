// netlify/functions/projection-params.js
const { createClient, corsHeaders, json } = require("./_common");

exports.handler = async (event) => {
  const method = event.httpMethod;

  if (method === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: ""
    };
  }

  if (method !== "GET") {
    return {
      statusCode: 405,
      headers: corsHeaders({ Allow: "GET,OPTIONS" }),
      body: "Method Not Allowed"
    };
  }

  const params = event.queryStringParameters || {};
  const district = (params.district || "").trim();
  const ptype = (params.ptype || "").trim(); // placeholder for future use

  if (!district) {
    return json({ error: "district is required (e.g. 'George Town')." }, 400);
  }

  const client = createClient();
  await client.connect();

  try {
    // 1) Get earliest & latest year for this district
    const rangeRes = await client.query(
      `
      SELECT
        MIN(year) AS from_year,
        MAX(year) AS to_year
      FROM rppi_indexes
      WHERE district = $1
      `,
      [district]
    );

    if (!rangeRes.rows.length || rangeRes.rows[0].from_year === null) {
      return json({ error: "No RPPI data found for district.", district }, 404);
    }

    const fromYear = Number(rangeRes.rows[0].from_year);
    const toYear = Number(rangeRes.rows[0].to_year);

    // 2) Get index values for those boundary years
    const valuesRes = await client.query(
      `
      SELECT year, index_value
      FROM rppi_indexes
      WHERE district = $1
        AND year IN ($2, $3)
      ORDER BY year
      `,
      [district, fromYear, toYear]
    );

    if (valuesRes.rows.length < 2) {
      return json({ error: "Insufficient data points to compute CAGR." }, 400);
    }

    const startRow = valuesRes.rows.find(r => Number(r.year) === fromYear);
    const endRow   = valuesRes.rows.find(r => Number(r.year) === toYear);

    const startIndex = Number(startRow.index_value);
    const endIndex   = Number(endRow.index_value);
    const years      = toYear - fromYear;

    if (!startIndex || !endIndex || years <= 0) {
      return json({ error: "Invalid RPPI data for CAGR calculation." }, 400);
    }

    // CAGR = (end / start)^(1/years) - 1
    const base = Math.pow(endIndex / startIndex, 1 / years) - 1;

    // Conservative (−2%) and aggressive (+2%) bands; floor conservative at 0
    const conservative = Math.max(base - 0.02, 0);
    const aggressive   = base + 0.02;

    return json({
      ok: true,
      district,
      property_type: ptype || null,
      from_year: fromYear,
      to_year: toYear,
      from_index: startIndex,
      to_index: endIndex,
      base,
      conservative,
      aggressive
    });
  } catch (err) {
    console.error("projection-params error:", err);
    return json({ error: "Failed to compute projection parameters.", detail: err.message }, 500);
  } finally {
    await client.end();
  }
};
