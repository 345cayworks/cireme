// netlify/functions/admin-logout.js
// Stateless JWTs can't be revoked server-side without a store; this endpoint is a no-op placeholder.
const { corsHeaders } = require("./_common");
exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: corsHeaders(), body: "" };
  return { statusCode: 204, headers: corsHeaders(), body: "" };
};
