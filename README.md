# CampusKart

CampusKart is a student-only marketplace. Verified students can sell items, bid in auctions, propose exchanges, and request legitimate campus services such as tutoring and design help. An admin can moderate users, listings, reports, and disputes.

Payments are simulated. This is an academic prototype: no card data is collected and no money moves. The service marketplace refuses requests to complete graded assignments or exams for another student.

## Stack

- React, Vite, and Tailwind CSS
- Node.js, Express, MongoDB, and Mongoose
- JWT sessions and bcrypt password hashes (`bcryptjs`, a pure JavaScript bcrypt implementation so Windows does not need a native compiler)
- Socket.IO for live bids, notifications, and chat
- Cloudinary when configured, otherwise files in `backend/uploads`
- Jest and Supertest, with an in-memory MongoDB for tests

## Project layout

```text
backend/src
  config/        environment and database connection
  models/        Mongoose models
  routes/        HTTP routes
  controllers/   request handlers
  services/      purchase, auction, chat, pricing, and trust rules
  middleware/    auth, validation, uploads, errors
  sockets/       Socket.IO
  seed/          demo data
frontend/src
  pages/         screens
  components/    shared UI
  context/       auth, toasts, sockets
docs/            requirements, diagrams, and test plan
```

## Requirements

- Node.js 18 or newer
- MongoDB 7 locally, or Docker

Node is not assumed to be on your PATH. The installer used for this machine put it in `C:\Program Files\nodejs`.

## Run it

```powershell
cd C:\Users\taran\CampusKart
docker compose up -d
copy backend\.env.example backend\.env
cd backend
npm install
npm run seed
npm run dev
```

In a second terminal:

```powershell
cd C:\Users\taran\CampusKart\frontend
npm install
npm run dev
```

Open http://localhost:5173. The API is http://localhost:5000. Vite proxies `/api`, `/uploads`, and Socket.IO, so the browser stays on one origin during development.

From the repo root, `npm run dev` starts both after dependencies are installed. `npm test` runs the API tests. `npm run seed` resets and fills the database.

## Demo accounts

| Email | Password | Notes |
| --- | --- | --- |
| admin@campuskart.edu | Admin@123 | Admin |
| aisha@campuskart.edu | Student@123 | Verified seller with a rating |
| rohan@campuskart.edu | Student@123 | Verified student |
| meera@campuskart.edu | Student@123 | Verified, offers tutoring |
| kabir@campuskart.edu | Student@123 | Registered but not verified |

Seed deletes the current `campuskart` database and writes these accounts again.

## Demo email verification

There is no mail server in local development. Registration, resend, and forgot-password responses include a block labelled **LOCAL DEMO ONLY** with a token and a path such as `/verify-email?token=...`. That block is omitted when `NODE_ENV=production`. Do not enable it on a public server. A real deployment should send the token by email and leave `DEMO_VERIFICATION` unset.

College emails must end in `.edu`, `.edu.in`, `.ac.in`, or `.ac.uk`. Add more domains with `EXTRA_EMAIL_DOMAINS` in `backend/.env`.

## Images

If `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are all set, uploads go to Cloudinary. Otherwise they are stored in `backend/uploads` and served from `/uploads`. The API log prints which mode is active.

## Roles

- **Student:** browse, and after verification list products, bid, buy, exchange, offer or request services, chat, review completed transactions, and file reports.
- **Admin:** stats, suspend or reinstate users, remove listings, and resolve reports and disputes.

The role is stored in MongoDB. It is not read from the request body or from a client-supplied JWT claim.

## Auction rules

Bids are accepted only by a compare-and-swap update on bid count, current price, and end time. A bid in the final two minutes extends the end time by two minutes. A scheduler closes due auctions every 10 seconds. No bids, or a high bid under the reserve, becomes `unsold`. A valid high bid creates an accepted auction order for the simulated payment step. Sellers cannot bid, cancel, or delete after the first bid.

## Tests

```powershell
cd backend
npm test
```

Tests do not need a running MongoDB. They cover registration, authorization, listings, purchases including a simultaneous double purchase, bid rules, concurrent bids, auction closing, anti-sniping, service requests, review eligibility, and admin access. See `docs/15-test-plan.md` and `docs/16-test-cases.md`.

A Postman collection is in `postman/CampusKart.postman_collection.json`.

## Documentation

The `docs/` folder holds the problem statement, SRS, architecture, diagrams, test plan, timeline, module responsibilities, and maintenance plan.
