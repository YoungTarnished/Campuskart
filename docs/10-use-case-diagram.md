# Use case diagram

```mermaid
flowchart LR
  Student((Student))
  Admin((Admin))
  Student --- Register
  Student --- Browse
  Student --- ListProduct
  Student --- Purchase
  Student --- Bid
  Student --- Exchange
  Student --- RequestService
  Student --- Chat
  Student --- Review
  Student --- Report
  Admin --- Moderate
  Admin --- Stats
  Register --- VerifyEmail
  Bid --- AuctionClose
```

Students reach listing, bidding, purchase, exchange, and service requests only after verification. Admins reach moderation and statistics. Auction closing is a system behavior that follows bidding, not a button on the page.
