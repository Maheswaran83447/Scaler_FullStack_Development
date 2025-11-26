const request = require("supertest");
const express = require("express");
const addressRoutes = require("../addressRoutes");
const authMiddleware = require("../../middleware/authMiddleware");
const UserAddressHandler = require("../../handlers/UserAddressHandler");

// Mock the dependencies
jest.mock("../../middleware/authMiddleware");
jest.mock("../../handlers/UserAddressHandler");

describe("Address Routes", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/user-addresses", addressRoutes);

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
    it("should return user addresses successfully", async () => {
      const mockAddresses = [
        {
          _id: "addr1",
          addressLine: "123 Test St",
          city: "Test City",
          state: "Test State",
          pincode: "123456",
        },
      ];

      UserAddressHandler.listUserAddresses.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          addresses: mockAddresses,
        });
      });

      const response = await request(app).get(
        "/api/user-addresses/testUserId123"
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.addresses).toHaveLength(1);
      expect(UserAddressHandler.listUserAddresses).toHaveBeenCalled();
    });

    it("should require authentication", async () => {
      authMiddleware.mockImplementation((req, res, next) => {
        res.status(401).json({ success: false, message: "Unauthorized" });
      });

      const response = await request(app).get(
        "/api/user-addresses/testUserId123"
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /", () => {
    it("should create a new address successfully", async () => {
      const newAddress = {
        userId: "testUserId123",
        addressLine: "456 New St",
        city: "New City",
        state: "New State",
        pincode: "654321",
      };

      UserAddressHandler.createUserAddress.mockImplementation((req, res) => {
        res.status(201).json({
          success: true,
          message: "Address created successfully",
          address: { _id: "newAddr1", ...newAddress },
        });
      });

      const response = await request(app)
        .post("/api/user-addresses")
        .send(newAddress);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.address).toBeDefined();
      expect(UserAddressHandler.createUserAddress).toHaveBeenCalled();
    });

    it("should require authentication for creating address", async () => {
      authMiddleware.mockImplementation((req, res, next) => {
        res.status(401).json({ success: false, message: "Unauthorized" });
      });

      const response = await request(app).post("/api/user-addresses").send({
        addressLine: "Test",
        city: "Test",
        state: "Test",
        pincode: "123456",
      });

      expect(response.status).toBe(401);
    });
  });

  describe("DELETE /:addressId", () => {
    it("should delete an address successfully", async () => {
      UserAddressHandler.deleteUserAddress.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          message: "Address deleted successfully",
        });
      });

      const response = await request(app).delete("/api/user-addresses/addr123");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Address deleted successfully");
      expect(UserAddressHandler.deleteUserAddress).toHaveBeenCalled();
    });

    it("should require authentication for deleting address", async () => {
      authMiddleware.mockImplementation((req, res, next) => {
        res.status(401).json({ success: false, message: "Unauthorized" });
      });

      const response = await request(app).delete("/api/user-addresses/addr123");

      expect(response.status).toBe(401);
    });
  });
});
