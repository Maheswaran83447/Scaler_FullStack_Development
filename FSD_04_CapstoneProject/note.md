# Analyse Changes

## Commits on 25 Nov 2025

### Cart.js (Back-End)

- **New Entity**: MongoDB schema for server-side cart persistence
- Fields: `userId` (ObjectId, unique, indexed), `items[]` (productId, quantity, addedAt), `updatedAt`
- Cart item schema: productId (ref to Product), quantity (min: 1), addedAt timestamp
- Timestamps enabled for tracking creation/updates
- Pre-save hook to update `updatedAt` field
- Virtual field: `itemCount` - calculates total quantity across all cart items
- Instance methods:
  - `addItem(productId, quantity)`: Adds new item or increments existing item quantity
  - `updateItemQuantity(productId, quantity)`: Updates quantity or removes if ≤ 0
  - `removeItem(productId)`: Removes specific item from cart
  - `clearCart()`: Empties all items from cart

### CartRepository.js (Back-End)

- **New Repository**: Data access layer for cart operations (170 lines)
- Added `findByUserId(userId)`: Fetches cart with populated product details
- Added `getOrCreateCart(userId)`: Gets existing cart or creates new empty cart
- Added `addItem(userId, productId, quantity)`: Adds item to cart or increments quantity
- Added `updateItemQuantity(userId, productId, quantity)`: Updates or removes item based on quantity
- Added `removeItem(userId, productId)`: Removes specific product from cart
- Added `clearCart(userId)`: Empties cart while preserving cart document
- Added `syncCart(userId, items[])`: Merges localStorage cart with server cart
  - Takes maximum quantity when same item exists in both
  - Adds items from localStorage that don't exist on server
  - Used for cross-device cart synchronization
- Added `deleteCart(userId)`: Permanently deletes cart document
- All methods include comprehensive error handling with descriptive messages

### CartHandler.js (Back-End)

- **New Handler**: API request handlers for cart operations
- Added `handleGetCart()`: Returns user's cart with all items
  - Returns empty cart structure if no cart exists
  - Requires authentication (401 if not authenticated)
- Added `handleAddItem()`: Adds item to cart
  - Validates productId and quantity (min: 1)
  - Returns 400 for invalid input
- Added `handleUpdateItem()`: Updates item quantity
  - Removes item if quantity ≤ 0
  - Returns appropriate message based on action
- Added `handleRemoveItem()`: Removes item from cart
  - Takes productId from URL params
  - Validates authentication and productId
- Added `handleClearCart()`: Empties entire cart
  - Returns empty cart structure
- Added `handleSyncCart()`: Syncs localStorage cart with server
  - Validates items array format
  - Merges local and server carts
  - Critical for cross-device cart persistence
- All handlers return structured response: `{success, message, cart}`
- Comprehensive error logging for debugging

### cartRoutes.js (Back-End)

- **New Routes**: RESTful API endpoints for cart management
- All routes require authentication via `authMiddleware`
- Route: `GET /api/cart` → Gets user's cart
- Route: `POST /api/cart/add` → Adds item to cart
  - Body: `{productId: String, quantity: Number}`
- Route: `PUT /api/cart/update` → Updates item quantity
  - Body: `{productId: String, quantity: Number}`
- Route: `DELETE /api/cart/remove/:productId` → Removes item
- Route: `DELETE /api/cart/clear` → Clears entire cart
- Route: `POST /api/cart/sync` → Syncs localStorage with server
  - Body: `{items: Array<{productId, quantity}>}`
- All routes documented with JSDoc comments

### authMiddleware.js (Back-End)

- **Enhanced**: Added `req.userId` assignment for cart operations
- Now sets both `req.user` (decoded token) and `req.userId` (extracted user ID)
- Supports both token formats: `decoded.userId` and `decoded.id`
- Ensures consistent userId access across all protected routes

### server.js (Back-End)

- **Enhanced**: Registered new cart routes
- Added: `app.use("/api/cart", require("./api/routes/cartRoutes"))`
- Cart API now accessible at `/api/cart/*` endpoints

### cartService.js (Front-End)

- **New Service**: Frontend API client for cart operations
- Uses `apiClient` for authenticated requests
- Added `getCart()`: Fetches user's cart from server
- Added `addItemToCart(productId, quantity)`: Adds item to server cart
- Added `updateCartItem(productId, quantity)`: Updates item quantity on server
- Added `removeCartItem(productId)`: Removes item from server cart
- Added `clearCart()`: Clears entire cart on server
- Added `syncCart(items[])`: Syncs localStorage cart to server
- All methods include error logging
- Exports both named functions and default service object

### CartContext.jsx (Front-End)

- **Major Enhancement**: Added server-side cart synchronization (185 lines total)
- **New imports**: cartService, authService, useCallback
- **New state**: `isSyncing` - tracks server sync operations
- **New helper**: `isLoggedIn()` - checks if user is authenticated (not guest)
- **On mount effect**: Fetches and merges server cart with localStorage
  - Converts server cart format to local cart format
  - Merges localStorage items with server items
  - Syncs localStorage items to server if needed
  - Gracefully handles errors (keeps using localStorage)
- **Enhanced `addToCart`**: Now async, syncs to server for logged-in users
  - Optimistic UI update (immediate local state change)
  - Background server sync (doesn't block user experience)
  - Error logged but doesn't interrupt flow
- **Enhanced `removeFromCart`**: Now async, syncs to server
  - Immediate local removal
  - Background server sync
- **Enhanced `updateQuantity`**: Now async, syncs to server
  - Local update first
  - Server sync in background
- **Enhanced `clearCart`**: Now async, syncs to server
  - Immediate local clear
  - Background server sync
- **Strategy**: Local-first for performance, server for cross-device persistence
- **New export**: `isSyncing` state exposed to consumers

### PlaceOrder.jsx (Front-End)

- **Major Enhancement**: Guest checkout implementation with auto-registration
- **New imports**: authService for guest account creation
- **New state**: `guestDetails` - form data for guest users (10 fields)
  - firstName, lastName, email, phoneNumber
  - addressLine1, addressLine2, landmark
  - city, state, pincode
- **New state**: `isCreatingGuestAccount` - tracks account creation process
- **New validation**: `isGuestFormValid` - validates required guest fields
  - Checks: firstName, email, phoneNumber, addressLine1, city, state, pincode
  - All must be non-empty after trim
- **Enhanced `isPayDisabled`**: Now includes guest form validation
  - Disabled if guest and form incomplete
- **New handler**: `handleGuestDetailsChange(field, value)` - updates guest form
- **Enhanced `handlePay()`**: Complete guest checkout flow
  - **Guest checkout logic**:
    1. Validates guest details
    2. Generates temporary password for guest user
    3. Creates user account via authService.register()
    4. Extracts new userId from registration response
    5. Uses guest-provided address directly (no database save)
    6. Marks address as default/current/shipping/billing
    7. Shows success toast
    8. Falls back to local cart on registration failure
  - **Registered user logic**: Uses selected saved address
  - Creates order payload with appropriate shipping address
  - Prefills Razorpay with guest email/phone or user details
- **Enhanced UI**: Conditional rendering based on `isGuest`
  - **Guest view**: Shows comprehensive guest details form
    - 2-column grid layout
    - 10 input fields with labels and required markers
    - Info note about account creation
  - **Registered user view**: Shows saved addresses with add/edit options
  - Changed payment button text from "Sign in to pay" to just "Pay {amount}"
  - Added info banner for guests explaining checkout process
- **New styles**: Added guest form styling
  - `guestFormContainer`, `guestFormGrid`
  - `formGroup`, `formLabel`, `formInput`
- **Improved UX**: Guest users no longer forced to sign in before checkout
- **Security**: Auto-generated passwords can be reset via email later

## Commits on 24 Nov 2025

### OrderHandler.js (Back-End)

- **New File**: Complete order handler implementation for authenticated users
- Added `listOrders()` method: Fetches all orders for authenticated user via `req.user.userId`
- Added `createOrder()` method: Creates new orders with full validation and returns 201 status on success
- Implemented authentication requirement checks (returns 401 if not authenticated)
- Error handling with 400 for ValidationError, 500 for other errors
- Integrated with OrderService for business logic

### PaymentHandler.js (Back-End)

- **New File**: Complete Razorpay payment integration handler
- Added `createOrder()` method:
  - Converts payment amount from rupees to paise (multiply by 100)
  - Validates amount is positive and finite number
  - Enriches order notes with userId (or "guest" for unauthenticated)
  - Returns orderId, amount, currency, and Razorpay public key
- Added `verifyPayment()` method:
  - Verifies Razorpay payment signature using HMAC
  - Requires orderId, paymentId, and signature from request
  - Returns 400 if signature validation fails
- All routes protected with authentication middleware

### UserAddressHandler.js (Back-End)

- **New File**: Complete address management handler (160 lines)
- Added `listUserAddresses()`: Fetches all addresses for a user with validation
- Added `createUserAddress()`: Creates new address with comprehensive sanitization
  - Validates required fields (addressLine1, city, state, pincode)
  - Normalizes boolean flags for default/current address settings
  - Sanitizes address tags to allowed values: "home", "work", "other"
  - Verifies user exists before address creation
- Added `deleteUserAddress()`: Removes address with ownership validation
- Implemented helper functions:
  - `normaliseBoolean()`: Converts various string/number formats to boolean
  - `sanitizeAddressPayload()`: Cleans and validates all address data
  - `validateUserId()`: Checks MongoDB ObjectId validity
- Returns 404 if user not found, 400 for invalid data

### addressRoutes.js (Back-End)

- **New File**: Express router for address API endpoints
- Route: `GET /:userId` → Lists all addresses for user
- Route: `POST /` → Creates new address
- Route: `DELETE /:addressId` → Deletes specific address

### orderRoutes.js (Back-End)

- **New File**: Express router for order API endpoints
- Route: `GET /` → Lists orders (requires auth middleware)
- Route: `POST /` → Creates new order (requires auth middleware)
- Both routes protected with authentication

### paymentRoutes.js (Back-End)

- **New File**: Express router for Razorpay payment endpoints
- Route: `POST /order` → Creates Razorpay order (requires auth middleware)
- Route: `POST /verify` → Verifies payment signature (requires auth middleware)
- All payment operations require authentication

### ProductDescription.js (Back-End)

- **New Entity**: MongoDB schema for product long-form descriptions
- Fields: `product` (ObjectId ref), `descriptionHtml` (string), `wordCount` (number)
- Unique index on product field (one description per product)
- Timestamps enabled for tracking creation/updates

### ProductDetail.js (Back-End)

- **New Entity**: MongoDB schema for product technical specifications
- Fields: `manufacturer`, `countryOfOrigin`, `itemModelNumber`, `productDimensions`, `asin`, `netQuantity`
- Unique index on product field
- All fields optional with trim and specific formatting (ASIN uppercase)
- Timestamps enabled

### ProductReview.js (Back-End)

- **New Entity**: MongoDB schema for customer product reviews
- Fields: `product` (ObjectId ref), `rating` (1-5), `comment` (3-2000 chars), `displayName`
- Compound index on product and createdAt for efficient querying
- Default displayName: "Cartify Shopper"
- Rating validation: min 1, max 5
- Comment validation: min 3, max 2000 characters

### ProductHandler.js (Back-End)

- **Enhanced**: Added new repository imports for ProductDetail, ProductDescription, ProductReview
- **Enhanced `listProducts()` method**:
  - Now fetches review summaries for all products in batch
  - Augments each product with `averageRating` and `reviewCount` fields
  - Falls back to rating: 0, count: 0 if review fetch fails
  - Non-critical failures logged with console.warn
- **Enhanced `getProductById()` method**:
  - Now fetches product details, description, and review overview
  - Combines all data into enriched single response payload
  - Adds `productDetails`, `productDescription`, `reviewSummary`, `recentReviews` fields
  - Independent error handling for each data source (product still returns if extras fail)
- **New `createProductReview()` method**:
  - Validates product exists before accepting review
  - Clamps rating value between 1-5 automatically
  - Validates comment is not empty
  - Creates review and returns updated overview with all reviews
  - Returns 201 status with review data and meta information

### productRoutes.js (Back-End)

- Added new route: `POST /:id/reviews` → Creates product review (calls ProductHandler.createProductReview)

### Order.js (Back-End)

- **Enhanced Entity**: Expanded shippingAddress schema with complete address structure
- **New fields added**:
  - `addressId`: Reference to saved address
  - `tag`: Address type (home/work/other)
  - `addressLine1`, `addressLine2`: Street address lines
  - `landmark`: Location landmark
  - `city`, `state`, `pincode`: Location details
  - `isDefaultShipping`, `isDefaultBilling`, `isCurrentAddress`: Boolean flags
- Retained legacy fields (`label`, `line`) for backward compatibility

### server.js (Back-End)

- **Enhanced**: Added 5 new API route mounts
- New routes mounted:
  - `/api/auth` → authRoutes (authentication endpoints)
  - `/api/orders` → orderRoutes (order management)
  - `/api/payments` → paymentRoutes (Razorpay integration)
  - `/api/user-addresses` → addressRoutes (address CRUD)
  - `/api/wishlist` → wishlistRoutes (wishlist management)
- Previously only had `/api/products` endpoint
- Complete API now spans 6 major feature areas

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
