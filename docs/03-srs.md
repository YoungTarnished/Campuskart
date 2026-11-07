# Software requirements specification

## 1. Introduction

CampusKart is a web system for a college marketplace. This SRS describes what the system must do for students and administrators.

## 2. Overall description

Students browse publicly. Writing actions require a JWT session. Listing, bidding, and starting a transaction also require a verified college email. Administrators moderate the platform. The system stores data in MongoDB and pushes live bid, chat, and notification events over Socket.IO.

## 3. Functional requirements

See `04-functional-requirements.md`. Each requirement has an identifier used by the test cases.

## 4. Non-functional requirements

See `05-non-functional-requirements.md`.

## 5. External interfaces

- Browser UI at port 5173 in development.
- JSON API at `/api`.
- WebSocket at `/socket.io`.
- Image files at `/uploads` or Cloudinary.

## 6. Constraints

Passwords are hashed with bcrypt. Prices, roles, bid amounts, and order status transitions are decided on the server. Academic integrity text is rejected for services and listings that offer to complete graded work.
