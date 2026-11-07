# Non-functional requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | Passwords are stored as bcrypt hashes. API responses never include the hash or reset tokens. |
| NFR-2 | Protected routes return 401 for a missing, expired, or revoked token and 403 for a suspended or unauthorized user. |
| NFR-3 | Listing queries are paginated, with a maximum page size of 50. |
| NFR-4 | Authentication and bidding endpoints are rate limited outside tests. |
| NFR-5 | Image uploads accept only real JPEG, PNG, and WEBP bytes, at most 5 files and 5 MB each. |
| NFR-6 | Auction close does not depend on a browser timer. A server interval finalizes due auctions. |
| NFR-7 | Purchase and bid conflicts return a clear 400 or 409 and do not leave two owners of one item. |
| NFR-8 | The interface works on a phone-width layout and a desktop layout, with labels, empty states, loading skeletons, toasts, and confirmation dialogs for bids and purchases. |
| NFR-9 | Configuration comes from environment variables. Production refuses to boot without `JWT_SECRET`. |
| NFR-10 | Automated tests run without a separately installed database. |
