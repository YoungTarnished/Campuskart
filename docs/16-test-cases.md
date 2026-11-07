# Test cases

| Case | Requirement | Expected |
| --- | --- | --- |
| Register with missing fields | FR-1 | 400 |
| Weak password | FR-2 | 400 |
| Gmail address | FR-2 | 400 |
| Body contains role admin | FR-3 | User is still a student |
| Demo verification label | FR-4 | Response includes LOCAL DEMO ONLY |
| Unverified create product | FR-5 | 403 |
| Login and profile read | FR-6 | 200 and email present for self |
| Logout then reuse token | FR-7 | 401 |
| Expired token | NFR-2 | 401 |
| Reset password then reuse old token | FR-7 | 401 |
| Create, search, filter, sort | FR-8 FR-10 | Matching rows, ascending prices |
| Edit another student's listing | FR-8 | 403 |
| Edit after a purchase request | FR-15 | 400 |
| Text file upload | NFR-5 | 400 |
| Real PNG upload | NFR-5 | 201 and a `/uploads` URL |
| Purchase uses server price | FR-12 | Amount equals listing price |
| Buy own product | FR-13 | 400 |
| Buy sold product | FR-13 | 409 |
| Two buyers at once | FR-14 | One 201 and one 409 |
| Other student reads the order | NFR-2 | 404 |
| Seller bids | FR-17 | 400 |
| Bid below increment | FR-17 | 400 |
| Bid after end time | FR-17 | 400 |
| Cancel or delete after a bid | FR-21 | 400 |
| Two equal bids at once | FR-18 | One bid stored |
| Bid inside two minutes | FR-19 | End time moves by two minutes |
| Close with no bids | FR-20 | unsold |
| Close under reserve | FR-20 | unsold |
| Close with a valid bid | FR-20 | sold and an accepted order |
| Suspended bid and login | FR-30 | 403 |
| Graded-work service text | FR-23 | 400 |
| Duplicate service request | FR-24 | 409 |
| Review before completion | FR-28 | 400 |
| Second review by same person | FR-28 | 409 |
| Review of self | FR-28 | 400 |
| Student calls admin stats | FR-30 | 403 |
| Admin removes a listing | FR-29 | Public GET returns 404 |
| Exchange a reserved product | FR-25 | 409 |
