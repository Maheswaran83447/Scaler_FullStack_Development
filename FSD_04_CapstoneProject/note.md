# Analyse Changes

## Commits on 21 Nov 2025

### UserAddressRepository.js (Back-End)

- **New File**: Complete repository implementation for managing user addresses
- Added CRUD operations: `createAddress`, `getAddressesForUser`, `getAddressById`, `updateAddress`, `deleteAddress`
- Implemented smart default flag management with `clearDefaultFlags` and `clearCurrentAddress` methods
- Added `setDefaultAddress` and `setCurrentAddress` for address preference handling
- Automatic handling of shipping/billing default flags during creation and updates

### UserRepository.js (Back-End)

- Enhanced `findUserById()` method with flexible options parameter
- Added support for `includePassword` option to explicitly select password hash field
- Allows conditional password field retrieval (excluded by default in schema)

### NavBar.jsx (Front-End)

- Added dynamic delivery location feature that displays user's current/default address
- Implemented `resolveUserId()` helper for safe user ID extraction across different data shapes
- Created `deriveLocationFromAddressEntry()` to intelligently parse address objects
- Integrated `addressService.list()` to fetch and display user addresses on component mount
- Added fallback to default location "Chennai · 600001" for guests or users without saved addresses
- Improved guest detection with `isGuest` flag validation
- Enhanced profile menu to only render for authenticated users (excludes guests)
- Changed Login from Link to button for better navigation control
- Added localStorage persistence for delivery location with `DELIVERY_STORAGE_KEY`
- Implemented proper cleanup with cancellation tokens in address fetching effect

### nav.css (Front-End)

- Added `max-width: 260px` to `.delivery-location` class to prevent layout overflow
- Applied `overflow: hidden` and `text-overflow: ellipsis` for graceful text truncation

### CartContext.jsx (Front-End)

- Enhanced `updateQuantity()` method with robust number validation
- Added `Number.isFinite()` checks to prevent NaN values
- Implemented `Math.max(0, normalized)` to ensure non-negative quantities
- Improved edge case handling for invalid quantity inputs

### useAuth.js (Front-End)

- Enhanced `loginAsGuest()` method to call `authService.logout()` first
- Changed guest object to use `isGuest: true` flag (replacing `id: "guest"`)
- Added `setError(null)` to clear any previous authentication errors

### Account.jsx (Front-End)

- **New File**: Complete account management page implementation (531 lines)
- Created tabbed interface with sections: Profile Overview, Saved Addresses, Change Password, Contact Support
- Implemented custom SVG icons: `IconHeadphones`, `IconMail`, `IconPhone`, `IconWhatsapp`
- Added address management with list view, delete functionality, and badge system
- Built password change form with validation (min 6 characters, match confirmation)
- Integrated contact support section with multiple communication channels
- Added user avatar display with initials fallback
- Implemented `resolveUserId()`, `resolveAddressId()`, `buildAddressLines()` helper functions
- Added guest user protection with redirect to login page
- Created responsive sidebar navigation with active state highlighting

### account.css (Front-End)

- **New File**: Complete styling for Account page (345 lines)
- Implemented modern card-based layout with gradient background
- Created responsive grid system with sidebar and content area
- Styled profile avatar with circular design and image support
- Designed badge system for address tags (Current, Default shipping, Default billing)
- Added contact card styling with icon integration
- Implemented form styling for password change feature
- Applied consistent color scheme using blue/slate palette
- Added mobile responsiveness with breakpoint at 960px

### Cart.jsx (Front-End)

- Complete redesign of cart page with professional UI (244 lines)
- Added product image display with fallback to placeholder
- Implemented price resolution helpers: `resolveUnitPrice()`, `resolveOriginalPrice()`, `resolveItemImage()`
- Created quantity controls with +/- buttons and manual input
- Added empty cart state with illustration and "Browse products" CTA
- Built order summary sidebar with items breakdown and totals
- Implemented better number handling in quantity controls
- Added line-item total calculations with strikethrough original price display
- Created separate handlers: `handleDecrement`, `handleIncrement`, `handleQuantityInput`
- Added cart header with clear cart button
- Implemented "Continue shopping" and "Proceed to checkout" actions

### QUICKSTART.md

- **Deleted**: Removed quick start guide file from repository

## Commits on 19 Nov 2025

### AuthHandler.js (Back-End)

Added: New handlePasswordChange method

Accepts userId and newPassword from request body
Validates input using express-validator
Calls authService.changePassword() to update the password
Returns success/error response

### authRoutes.js (Back-End)

Added: New /change-password POST route

Validates userId (must be valid MongoDB ID) and newPassword (min 6 chars)
Routes to AuthHandler.handlePasswordChange()

### AuthService.js (Back-End)

Added: New changePassword method

Takes userId and newPassword parameters
Validates inputs (userId required, password min 6 chars)
Finds user by ID with password included
Updates password hash and clears any password reset tokens
Returns success message

### authService.js (Front-End)

Added: New changePassword function

Makes POST request to /api/auth/change-password
Sends userId and newPassword in request body
Handles errors with descriptive messages

### Home.old.jsx (Front-End)

New file: This is a completely new file (392 lines)

Appears to be a backup/archive of an older version of the Home component
Contains the full home page implementation with carousel, product grid, wishlist functionality, etc.

### Wishlist items

- Updated product cards with a wishlist heart toggle; clicking saves the item for later inside the new wishlist context.
- Implemented a dedicated wishlist page that lists saved products and supports toggling the heart again to remove them from the list.

## Commits on 17 Nov 2025

- Expanded `AuthService` with secure credential verification, bcrypt password hashing, and structured error messaging for bad sign-ins.

### Order Lifecycle Enhancements

- Connected the checkout “Proceed to buy” flow to a new `/api/orders` POST endpoint that stores items, payment method, and shipping address in Mongo.
- Added order-creation validation and metadata (totals, timestamps, status) within the service layer for consistent downstream reads.
- Updated the front-end checkout page to call the new API, show toast feedback, clear the cart, and route to the order history view.
- Wired the `/orders` route and React page to fetch filtered history, surface order metadata, and support “repeat order” back into the cart.

### Wishlist Experience

- Introduced a persisted `WishlistContext` to store favourite products and expose an `isInWishlist/toggleWishlistItem` API app-wide.
- Rendered Material UI heart icons on product cards and detail views, flipping between outline and filled states with appropriate toast messaging.
- Removed default button chrome so the heart icon presents without borders while keeping keyboard focus outlines.

### Home Page Enhancements

- Added a horizontal “product strip” beneath the carousel that showcases ten quick-look thumbnails with snap scrolling and tooltips.
- Inserted a mid-page promotional banner with “Know more →” CTA above the category grid to highlight seasonal campaigns.
- Restructured the featured-products section to two rows of three cards, wrapped in a light background container for emphasis.
- Limited each category grid (Appliances, Veg & Fruits, Fashion, etc.) to the first four products to keep the page scannable.

### Styling Polish

- Restyled the order-history header copy with deeper blue tones for better contrast on the dark surface.
- Increased spacing between items in the product strip and centred the row so the thumbnails read like a balanced gallery.

### Reset Password

- Enabled a "Forgot password" flow so users can request a reset link and complete password updates without contacting support.

## Commits on 15 Nov 2025

### Front-End Authentication Refresh

- Retired the legacy Lottie animation from the landing hero, reducing bundle size and removing a fragile runtime dependency.
- Revamped the login screen so email/phone plus password validation runs on input, enabling the sign-in button only when credentials are present.
- Persisted the JWT and derived user profile in local storage, ensuring authenticated sessions survive tab refreshes.

### Brand & Navigation Alignment

- Rebuilt `CartifyLogo.jsx` around the latest SVG asset to keep the React header perfectly aligned with design-system updates.
- Tuned navbar spacing around the refreshed logo to preserve visual balance across breakpoints.

### Backend Auth Hardening

- Expanded `AuthService` with secure credential verification, bcrypt password hashing, and structured error messaging for bad sign-ins.
- Introduced `UserRepository` helpers that encapsulate Mongo lookups and updates, preparing the service layer for future profile features.

## Commits on 14 Nov 2025

### Feature: Navbar Branding Refresh

- Replaced the plain text brand mark with the new Cartify SVG logo so the header reflects the latest design system.
- Adjusted surrounding spacing to give the logo and adjacent elements more breathing room on desktop breakpoints.

### Feature: Delivery Info Visibility

- Enlarged the delivery icon, label, and location text to make the “Delivery to” block easier to scan at a glance.
- Persisted the delivery location in `localStorage` and auto-filled it from the signed-in user’s profile data when available.

### Feature: Intelligent Search Suggestions

- Added a debounced search call in the navbar that surfaces backend-powered suggestions after the third character.
- Introduced friendly empty/error states and abort handling so the UI remains responsive even on slow networks.

### Feature: Profile Access & Cart Awareness

- Embedded a profile dropdown with quick navigation to account, orders, and wishlist pages.
- Implemented outside-click and Escape-key handling to keep the dropdown behaviour predictable.
- Continued surfacing the live cart item count by reading from the shared cart context.
- Cart line items remain persisted in `localStorage` for this iteration; once user management lands, we will migrate the cart to the database for authenticated shoppers.

### Feature: Toast Notification System

- Built a reusable toast provider/context that exposes a `showToast` helper across the application tree.
- Styled the toast component with accessible colours, focus outlines, and manual dismiss controls.

### Feature: Add-to-Cart Feedback Across Pages

- Triggered success toasts whenever items are added from the Home, Products listing, or Product Details screens.
- Wrapped all handlers in shared helpers to ensure IDs and quantities still flow correctly into the cart state.

### Feature: Reproducible Data Utilities

- Retained seeding scripts such as `seedDatabase.js` in version control so the product catalogue can be rebuilt on demand.

### Feature: Backend & Data Pipeline Enhancements

- Provisioned a dedicated MongoDB Atlas cluster and migrated seeded catalogue data from local JSON mocks to the managed database.
- Exposed Express endpoints that read live product information from Atlas, replacing hard-coded arrays and enabling pagination and search queries.
- Standardised environment configuration so the backend runs locally on port 5001 while still targeting the cloud database, keeping development and production closer in behaviour.
- Generated the Atlas seed dataset with GitHub Copilot’s assistance, ensuring consistent product structures and realistic category coverage.

### Feature: Documentation & Tracking

- Recorded this change set in `note.md` to align with the capstone requirement of logging push-level activity.
