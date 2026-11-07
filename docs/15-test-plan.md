# Test plan

## Scope

API tests in `backend/tests` cover authentication, products, orders, auctions, services, reviews, exchanges, and admin authorization. The UI is checked by exercising the pages against a running API.

## Environment

Jest starts `mongodb-memory-server`, sets `NODE_ENV=test`, and imports the Express app without listening. Rate limits are skipped so the suite can register many users. Bcrypt cost is 4 in tests and 12 when the API runs normally.

## How to run

```powershell
cd backend
npm test
```

The command is `jest --runInBand --forceExit`. The first run downloads a MongoDB binary and can take several minutes.

## Pass criteria

Every test in the files below passes:

- `tests/auth.test.js`
- `tests/products.test.js`
- `tests/orders.test.js`
- `tests/auctions.test.js`
- `tests/services-reviews-admin.test.js`

A failure in a concurrency test is a product bug, not a reason to retry until it passes. Bid and purchase tests assert the database, not only the HTTP status.

## Manual checks

After `npm run seed`, sign in as Aisha, open a listing, and as Rohan request to buy it. Place a bid on the calculator auction and confirm the history updates. Sign in as the admin and open the dashboard.
