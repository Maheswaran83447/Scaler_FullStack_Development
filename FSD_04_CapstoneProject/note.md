# Analyse Changes

## Feature: Navbar Branding Refresh

- Replaced the plain text brand mark with the new Cartify SVG logo so the header reflects the latest design system.
- Adjusted surrounding spacing to give the logo and adjacent elements more breathing room on desktop breakpoints.

## Feature: Delivery Info Visibility

- Enlarged the delivery icon, label, and location text to make the “Delivery to” block easier to scan at a glance.
- Persisted the delivery location in `localStorage` and auto-filled it from the signed-in user’s profile data when available.

## Feature: Intelligent Search Suggestions

- Added a debounced search call in the navbar that surfaces backend-powered suggestions after the third character.
- Introduced friendly empty/error states and abort handling so the UI remains responsive even on slow networks.

## Feature: Profile Access & Cart Awareness

- Embedded a profile dropdown with quick navigation to account, orders, and wishlist pages.
- Implemented outside-click and Escape-key handling to keep the dropdown behaviour predictable.
- Continued surfacing the live cart item count by reading from the shared cart context.
- Cart line items remain persisted in `localStorage` for this iteration; once user management lands, we will migrate the cart to the database for authenticated shoppers.

## Feature: Toast Notification System

- Built a reusable toast provider/context that exposes a `showToast` helper across the application tree.
- Styled the toast component with accessible colours, focus outlines, and manual dismiss controls.

## Feature: Add-to-Cart Feedback Across Pages

- Triggered success toasts whenever items are added from the Home, Products listing, or Product Details screens.
- Wrapped all handlers in shared helpers to ensure IDs and quantities still flow correctly into the cart state.

## Feature: Reproducible Data Utilities

- Retained seeding scripts such as `seedDatabase.js` in version control so the product catalogue can be rebuilt on demand.

## Feature: Backend & Data Pipeline Enhancements

- Provisioned a dedicated MongoDB Atlas cluster and migrated seeded catalogue data from local JSON mocks to the managed database.
- Exposed Express endpoints that read live product information from Atlas, replacing hard-coded arrays and enabling pagination and search queries.
- Standardised environment configuration so the backend runs locally on port 5001 while still targeting the cloud database, keeping development and production closer in behaviour.
- Generated the Atlas seed dataset with GitHub Copilot’s assistance, ensuring consistent product structures and realistic category coverage.

## Feature: Documentation & Tracking

- Recorded this change set in `note.md` to align with the capstone requirement of logging push-level activity.
