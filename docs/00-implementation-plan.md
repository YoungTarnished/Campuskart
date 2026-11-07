# Implementation plan

CampusKart is built as a modular Express API plus a React client. Each phase leaves the API runnable. Business rules live in services so controllers stay thin and tests can call the auction closer directly.

## Approach

- MVC on the server: routes, controllers, Mongoose models, middleware, and services.
- JWT proves identity and a `tokenVersion`. Role, verification, and suspension are loaded from the database on every request.
- Purchases and bids use a single-document atomic update. That stays correct on a standalone MongoDB server, where multi-document transactions need a replica set.
- Socket.IO broadcasts results. It does not decide prices, winners, or permissions.
- The client is a set of route pages over a small API helper, with shared cards, dialogs, and toasts.

## Files

- `backend/src/models` for User, Product, Auction, Bid, Order, Service, ServiceRequest, ExchangeProposal, Conversation, Message, Notification, Review, Report, Dispute, and Wishlist.
- `backend/src/services/orderService.js`, `auctionService.js`, `exchangeService.js`, `chatService.js`, `reviewService.js`, `priceService.js`.
- `backend/src/middleware/auth.js` for protection, verification, and admin checks.
- `frontend/src/pages` for every required screen.
- `backend/tests` for the automated cases.

## Edge cases

Own purchase, sold or reserved items, simultaneous buyers, low bids, late bids, seller bids, simultaneous bids, auctions with no bids, cancel after bids, suspended and unverified users, editing someone else's listing, duplicate or early reviews, duplicate service requests, invalid images, missing fields, expired tokens, and disputes. The UI shows the API error and refetches after a failed bid so a dropped response is not treated as success.

## Tests

`npm test` in `backend` runs Jest with Supertest and `mongodb-memory-server`.
