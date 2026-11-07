# Database design

```mermaid
erDiagram
  USER ||--o{ PRODUCT : sells
  USER ||--o{ AUCTION : sells
  USER ||--o{ BID : places
  AUCTION ||--o{ BID : has
  USER ||--o{ ORDER : buys
  PRODUCT ||--o{ ORDER : reserves
  USER ||--o{ SERVICE : offers
  SERVICE ||--o{ SERVICE_REQUEST : receives
  USER ||--o{ EXCHANGE : proposes
  USER ||--o{ CONVERSATION : joins
  CONVERSATION ||--o{ MESSAGE : contains
  USER ||--o{ NOTIFICATION : receives
  USER ||--o{ REVIEW : writes
  USER ||--o{ REPORT : files
  USER ||--o{ DISPUTE : opens
  USER ||--o{ WISHLIST : saves
  PRODUCT ||--o{ WISHLIST : appears_in
```

Relationships use ObjectId references. Recently viewed products and watched auctions are embedded on the user because they are per-person lists, not shared records. Wishlist is its own collection with a unique pair of user and product.

Indexes cover email, product status plus category and price, auction status plus end time, bids by auction, orders by product and status, one open review per reviewer and transaction, and conversation participants.

Enums constrain category, condition, year, and every status field. `createdAt` and `updatedAt` are on every collection.
