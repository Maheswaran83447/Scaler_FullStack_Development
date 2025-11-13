# E-Commerce Capstone Project

A full-stack e-commerce application built with MERN stack (MongoDB, Express, React, Node.js).

## Project Structure

### Backend (`/Back-End`)

```
src/
├── api/
│   ├── handlers/          # API request handlers
│   └── routes/            # Express route definitions
├── domain/
│   ├── entities/          # Mongoose models
│   ├── repositories/      # Data access layer
│   └── services/          # Business logic
├── infrastructure/
│   ├── database/          # Database connection
│   └── middleware/        # Express middleware
├── lib/
│   ├── utils/             # Helper functions
│   └── validators/        # Input validation rules
└── scripts/               # Database seeding scripts
```

### Frontend (`/Front-End`)

```
src/
├── pages/                 # Page components
├── features/              # Feature-based modules
│   ├── auth/              # Authentication feature
│   ├── products/          # Product feature
│   └── cart/              # Shopping cart feature
├── components/
│   └── common/            # Reusable components
├── services/              # API and external services
├── hooks/                 # Custom React hooks
├── utils/                 # Utility functions
├── styles/                # Global styles
└── assets/                # Images, animations
```

## Setup Instructions

### Backend Setup

1. **Navigate to Back-End directory**

   ```bash
   cd Back-End
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to Front-End directory**

   ```bash
   cd Front-End
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create `.env` file**

   ```
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## Key Features

- User authentication (register/login)
- Product catalog with search and filtering
- Shopping cart management
- Order processing
- User profiles
- Product reviews and ratings

## Technology Stack

**Backend:**

- Express.js
- MongoDB & Mongoose
- JWT for authentication
- bcryptjs for password hashing

**Frontend:**

- React 18
- Vite
- Lottie for animations
- Fetch API for HTTP requests

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Products

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin)

### Orders

- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create order

## Development Tips

1. **Code Organization**: Features are organized by domain, not by file type
2. **Services**: Business logic is in services, not in components
3. **Repositories**: Database operations are abstracted through repositories
4. **Hooks**: Custom hooks encapsulate stateful logic
5. **Validation**: Input validation happens at service and API level

## Contributing

1. Create a feature branch
2. Make your changes
3. Test locally
4. Submit a pull request

## License

ISC
