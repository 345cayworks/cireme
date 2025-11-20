

## Admin login function
Set these in your Netlify site environment:
- `ADMIN_EMAIL` = your admin email (e.g. admin@cireme.cayworks.com)
- `ADMIN_PASSWORD` = strong password
- `JWT_SECRET` = same as used by other functions

Login page: `/admin-login.html` → issues a JWT with `role=admin` (24h).


## Admin logout
- A **Logout** button appears for admins (top-right or inside nav).
- On click: calls `/.netlify/functions/admin-logout` (no-op), clears stored tokens, and redirects to `/admin-login.html`.
- JWTs are stateless; true server-side revocation would require a blacklist store.
