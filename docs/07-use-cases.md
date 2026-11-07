# Use cases

## UC-1 Register and verify

The student submits a college email and profile. The system stores a hashed password and a verification token. In local development the token is shown in the response with a demo label. After verification, listing and bidding unlock.

## UC-2 Publish a product

A verified student enters the listing fields and at least one uploaded image. The system may attach a suggested price. The listing appears in search.

## UC-3 Buy an item

A different verified student sends a purchase request. The product becomes reserved. The seller accepts or rejects. After acceptance the buyer confirms a simulated payment and the product is sold.

## UC-4 Bid

A verified student who is not the seller submits an amount. The server accepts it only when it still beats the stored high bid. People watching the auction receive the new price over Socket.IO.

## UC-5 Close an auction

The scheduler finds auctions whose end time has passed, locks the document, and marks it sold or unsold. The winner and seller are notified.

## UC-6 Request a service

A student describes what they want to learn or have designed. The provider accepts or rejects. Either party can mark an accepted request complete. A second open request from the same student is rejected.

## UC-7 Exchange

A student offers one of their eligible products for another. The owner accepts, and both products become exchanged, or rejects and nothing changes.

## UC-8 Chat

A student opens a conversation from a listing. Messages are stored and delivered to the other participant. A third student receives 404.

## UC-9 Review

After completion, each participant may leave one rating for the other person. The average on the profile updates.

## UC-10 Moderate

An admin suspends a user, removes a listing, or resolves a report or dispute. A student who calls an admin route receives 403.
