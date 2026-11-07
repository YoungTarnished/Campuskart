# Functional requirements

| ID | Requirement |
| --- | --- |
| FR-1 | A student can register with name, college email, password, college, department, and year. |
| FR-2 | Registration rejects non-academic emails and weak passwords. |
| FR-3 | The client cannot choose the role or verification flag. |
| FR-4 | A demo verification token is returned only outside production. |
| FR-5 | Unverified students cannot publish products, services, bids, or transactions. |
| FR-6 | Users can log in, log out, reset a password, and edit their profile. |
| FR-7 | Logout and password reset invalidate older tokens. |
| FR-8 | Students can create, edit, and delete their own available listings. |
| FR-9 | Listings support images, category, condition, price, campus location, exchange eligibility, discount, and urgent sale. |
| FR-10 | Anyone can search, filter, and sort products. |
| FR-11 | Students can wishlist items and view a public seller profile without the seller's email. |
| FR-12 | A buyer can request a purchase. The seller can accept or reject. The buyer confirms a simulated payment. |
| FR-13 | A student cannot buy their own product or a product that is not available. |
| FR-14 | Two simultaneous purchase requests cannot both reserve the same product. |
| FR-15 | Listings with an active transaction cannot be edited or deleted. |
| FR-16 | Sellers can create auctions with a start price, increment, window, and optional reserve. |
| FR-17 | Bids must beat the current price by the increment. Sellers cannot bid. Expired auctions reject bids. |
| FR-18 | Simultaneous bids leave one consistent high bid. |
| FR-19 | A bid in the final two minutes extends the auction by two minutes. |
| FR-20 | The server closes auctions. No qualifying bid means unsold. The high bidder who meets reserve wins. |
| FR-21 | Sellers cannot cancel or delete an auction after a bid exists. |
| FR-22 | Students can offer the allowed service categories and accept, reject, cancel, or complete requests. |
| FR-23 | Offers to complete graded assignments or exams are rejected. |
| FR-24 | A student cannot open two active requests for the same service. |
| FR-25 | Students can propose an exchange of two available, eligible products and the owner can accept or reject. |
| FR-26 | Participants can exchange messages in real time. Other students cannot read the thread. |
| FR-27 | The system stores notifications for bids, orders, services, exchanges, messages, reports, and disputes. |
| FR-28 | A review of 1 to 5 stars is allowed once per participant after the transaction is completed, and never of oneself. |
| FR-29 | Students can report listings. Admins can dismiss or act on reports and disputes. |
| FR-30 | Admins can see platform counts and suspend users. Suspended users cannot sign in. |
| FR-31 | The price suggestion explains the median and condition factor it used. |
