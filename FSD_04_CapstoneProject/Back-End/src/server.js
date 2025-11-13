require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDatabase } = require("./infrastructure/database/connection");

// Initialize app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "API is running", timestamp: new Date() });
});

// Routes (placeholder - add your routes here)
// app.use('/api/auth', require('./api/routes/authRoutes'));
// app.use('/api/products', require('./api/routes/productRoutes'));
// app.use('/api/users', require('./api/routes/userRoutes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// Connect database and start server
const startServer = async () => {
  try {
    await connectDatabase();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
