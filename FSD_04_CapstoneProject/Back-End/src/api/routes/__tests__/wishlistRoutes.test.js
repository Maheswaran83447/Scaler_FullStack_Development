const request = require("supertest");
const express = require("express");
const wishlistRoutes = require("../wishlistRoutes");
const authMiddleware = require("../../middleware/authMiddleware");
const WishlistHandler = require("../../handlers/WishlistHandler");

// Mock the dependencies
jest.mock("../../middleware/authMiddleware");
jest.mock("../../handlers/WishlistHandler");

describe("Wishlist Routes", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/wishlist", wishlistRoutes);

    // Mock auth middleware to pass authentication
    authMiddleware.mockImplementation((req, res, next) => {
      req.userId = "testUserId123";
      req.user = { userId: "testUserId123", email: "test@example.com" };
      next();
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /:userId", () => {
    it("should return user wishlist successfully", async () => {
      const mockWishlist = [
        {
          _id: "wish1",
          userId: "testUserId123",
          productId: {
            _id: "prod1",
            title: "Test Product",
            price: 999,
          },
          addedAt: new Date(),
        },
      ];

      WishlistHandler.listWishlist.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          wishlist: mockWishlist,
        });
      });

      const response = await request(app).get("/api/wishlist/testUserId123");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.wishlist).toHaveLength(1);
      expect(WishlistHandler.listWishlist).toHaveBeenCalled();
    });

    it("should require authentication", async () => {
      authMiddleware.mockImplementation((req, res, next) => {
        res.status(401).json({ success: false, message: "Unauthorized" });
      });

      const response = await request(app).get("/api/wishlist/testUserId123");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should return empty wishlist for new user", async () => {
      WishlistHandler.listWishlist.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          wishlist: [],
        });
      });

      const response = await request(app).get("/api/wishlist/newUserId");

      expect(response.status).toBe(200);
      expect(response.body.wishlist).toHaveLength(0);
    });
  });

  describe("POST /", () => {
    it("should add item to wishlist successfully", async () => {
      const wishlistItem = {
        userId: "testUserId123",
        productId: "prod123",
      };

      WishlistHandler.addWishlistItem.mockImplementation((req, res) => {
        res.status(201).json({
          success: true,
          message: "Item added to wishlist",
          wishlistItem: {
            _id: "wish123",
            ...wishlistItem,
            addedAt: new Date(),
          },
        });
      });

      const response = await request(app)
        .post("/api/wishlist")
        .send(wishlistItem);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Item added to wishlist");
      expect(WishlistHandler.addWishlistItem).toHaveBeenCalled();
    });

    it("should require authentication for adding to wishlist", async () => {
      authMiddleware.mockImplementation((req, res, next) => {
        res.status(401).json({ success: false, message: "Unauthorized" });
      });

      const response = await request(app).post("/api/wishlist").send({
        userId: "testUserId123",
        productId: "prod123",
      });

      expect(response.status).toBe(401);
    });

    it("should handle duplicate product in wishlist", async () => {
      WishlistHandler.addWishlistItem.mockImplementation((req, res) => {
        res.status(400).json({
          success: false,
          message: "Product already in wishlist",
        });
      });

      const response = await request(app).post("/api/wishlist").send({
        userId: "testUserId123",
        productId: "prod123",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Product already in wishlist");
    });
  });

  describe("DELETE /:userId/:productId", () => {
    it("should remove item from wishlist successfully", async () => {
      WishlistHandler.removeWishlistItem.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          message: "Item removed from wishlist",
        });
      });

      const response = await request(app).delete(
        "/api/wishlist/testUserId123/prod123"
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Item removed from wishlist");
      expect(WishlistHandler.removeWishlistItem).toHaveBeenCalled();
    });

    it("should require authentication for removing from wishlist", async () => {
      authMiddleware.mockImplementation((req, res, next) => {
        res.status(401).json({ success: false, message: "Unauthorized" });
      });

      const response = await request(app).delete(
        "/api/wishlist/testUserId123/prod123"
      );

      expect(response.status).toBe(401);
    });

    it("should handle removing non-existent item gracefully", async () => {
      WishlistHandler.removeWishlistItem.mockImplementation((req, res) => {
        res.status(404).json({
          success: false,
          message: "Item not found in wishlist",
        });
      });

      const response = await request(app).delete(
        "/api/wishlist/testUserId123/nonexistent"
      );

      expect(response.status).toBe(404);
    });
  });
});
