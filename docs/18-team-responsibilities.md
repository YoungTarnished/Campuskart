# Module responsibilities

The work is split by role. This document does not invent individual assignees.

| Module | Primary role | Support |
| --- | --- | --- |
| Requirements and SRS | Product | All roles review scope |
| Auth, users, JWT | Backend | QA writes registration cases |
| Product catalogue and uploads | Backend and UI | QA checks filters and image types |
| Orders and exchanges | Backend | UI builds both dashboards |
| Auctions and scheduler | Backend | UI builds the countdown and confirms it refetches |
| Services and integrity rule | Backend | Product reviews the banned phrases |
| Chat and notifications | Backend and UI | QA checks a third user cannot open a thread |
| Reviews, reports, admin | Backend and UI | QA checks student access to admin routes |
| Automated tests | QA | Backend fixes failures |
| Documentation and seed data | Product | Backend keeps the demo accounts working |
| Deployment notes and backups | Maintenance | See the maintenance plan |
