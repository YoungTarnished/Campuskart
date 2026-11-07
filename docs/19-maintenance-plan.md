# Maintenance plan

## Running changes

- Add a field in the Mongoose model and the Zod schema together. Update the React form in the same change.
- Keep category lists in `backend/src/constants.js` and `frontend/src/constants.js` identical.
- Put new transaction rules in a service and cover them with a Supertest case before changing the button that calls them.

## Operations

- Take a MongoDB dump before running `npm run seed`. Seed drops the database.
- Rotate `JWT_SECRET` only with a planned logout of every session, because existing tokens will fail.
- Watch `backend/uploads` disk use when Cloudinary is not configured. Filenames are random, so users cannot overwrite another file by name.
- The auction scheduler runs inside the API process. Run one API instance, or move the closer to a single worker, before horizontally scaling. Two closers are safe because of the `closing` lock, but two schedulers are wasted work.
- Replace the demo verification response with an email sender before any public deployment, and set `NODE_ENV=production`.

## Known limits

- Price suggestions scan comparable listings in memory. A larger campus should aggregate by category.
- Unread message counts loop conversations. That is fine at campus scale and should become one aggregation if inboxes grow large.
- Compare-and-swap protects a single product or auction document. It is the chosen strategy because a standalone MongoDB server cannot run multi-document transactions.

## Backups

Dump `campuskart` daily in any shared deployment. Restoring a dump is preferred to reseeding, because seed data replaces real orders.
