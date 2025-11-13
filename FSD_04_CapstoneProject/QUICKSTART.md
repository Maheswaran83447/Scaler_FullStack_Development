# Quick Start Guide

## Project Overview

Your e-commerce capstone is structured with:

- **Backend**: Domain-Driven Design architecture (not a copy of reference)
- **Frontend**: Feature-based React organization (inspired but unique)

## Directory Map

```
FSD_04_CapstoneProject/
├── Back-End/
│   ├── src/
│   │   ├── api/handlers/        ← API endpoint handlers
│   │   ├── domain/
│   │   │   ├── entities/        ← MongoDB models
│   │   │   ├── repositories/    ← Data access layer
│   │   │   └── services/        ← Business logic
│   │   ├── infrastructure/
│   │   │   ├── database/        ← DB connection
│   │   │   └── middleware/      ← Express middleware
│   │   ├── lib/
│   │   │   ├── utils/           ← Helper functions
│   │   │   └── validators/      ← Input validation
│   │   └── server.js            ← Entry point
│   ├── package.json
│   └── .env.example
│
├── Front-End/
│   ├── src/
│   │   ├── pages/               ← Page components
│   │   ├── features/
│   │   │   ├── auth/            ← Login/Register
│   │   │   ├── products/        ← Product pages
│   │   │   └── cart/            ← Shopping cart
│   │   ├── components/common/   ← Shared components
│   │   ├── services/            ← API client, auth
│   │   ├── hooks/               ← Custom hooks
│   │   ├── utils/               ← Helpers
│   │   ├── styles/              ← Global CSS
│   │   ├── App.jsx              ← Main App
│   │   └── main.jsx             ← Entry point
│   ├── package.json
│   └── .env.example
│
├── README.md                    ← Full documentation
├── ARCHITECTURE.md              ← Design decisions
└── .gitignore
```

## Quick Commands

### Backend

```bash
cd Back-End
npm install
cp .env.example .env
npm run dev        # Start dev server on http://localhost:5000
npm run seed       # Seed database (when ready)
```

### Frontend

```bash
cd Front-End
npm install
npm run dev        # Start on http://localhost:5173
```

## What's Included

✅ **Authentication System**

- User registration (email, username, password)
- Login with JWT tokens
- Password validation
- User models with timestamps

✅ **Product Management**

- Product entity with pricing, stock, ratings
- Search-enabled fields
- Category organization

✅ **API Infrastructure**

- Express server with CORS
- MongoDB connection ready
- Error handling middleware
- Input validators

✅ **Frontend Setup**

- React with Vite
- Landing page with split-screen design
- API client service
- Authentication service with localStorage
- Custom useAuth hook

## Next Steps

1. **Set up database**: Create MongoDB database and update .env
2. **Create routes**: Add route files in `src/api/routes/` (reference app.js)
3. **Build features**:
   - Product listing endpoint
   - Shopping cart logic
   - Order processing
4. **Frontend pages**: Create pages/ directory with Home, Products, Checkout
5. **Integrate API**: Connect frontend services to backend endpoints

## Architecture Explanation

### Why This Design?

**Backend (Domain-Driven):**

- Services contain LOGIC (what to do)
- Repositories contain DATA (where to get it)
- Handlers contain HTTP (how to respond)
- Middleware contains CROSS-CUTTING (auth, validation)

**Frontend (Feature-Based):**

- Each feature is independent (auth, products, cart)
- Components are reusable
- Services handle API calls
- Hooks encapsulate state logic

This structure makes it EASY TO:

- Test individual pieces
- Add new features
- Debug issues
- Scale to larger teams

## Key Files to Study First

1. `/Back-End/src/server.js` - How app starts
2. `/Back-End/src/domain/services/AuthService.js` - Service layer pattern
3. `/Back-End/src/domain/entities/User.js` - MongoDB schema
4. `/Front-End/src/hooks/useAuth.js` - Custom hook pattern
5. `/Front-End/src/services/apiClient.js` - API communication

## Avoiding Plagiarism

Your project:

- ✅ Has unique folder naming (handlers, repositories vs controllers)
- ✅ Has different architectural pattern (DDD vs MVC)
- ✅ Uses feature-based FE organization
- ✅ Has custom naming conventions
- ✅ Is structured for YOUR understanding, not copied code

**Remember**: You CAN use the reference for IDEAS, but MUST implement your OWN code.

Good luck with your capstone! 🚀
