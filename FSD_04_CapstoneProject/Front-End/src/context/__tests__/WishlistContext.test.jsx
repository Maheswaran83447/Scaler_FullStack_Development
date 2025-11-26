import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WishlistProvider, WishlistContext } from "../WishlistContext";
import wishlistService from "../../services/wishlistService";

// Mock the wishlist service
vi.mock("../../services/wishlistService", () => ({
  default: {
    getWishlist: vi.fn(),
    addToWishlist: vi.fn(),
    removeFromWishlist: vi.fn(),
  },
}));

describe("WishlistContext", () => {
  const mockUser = {
    _id: "user123",
    email: "test@example.com",
    isGuest: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe("Wishlist Provider Initialization", () => {
    it("should initialize with empty wishlist for new users", () => {
      let contextValue;

      const TestComponent = () => {
        contextValue = React.useContext(WishlistContext);
        return <div>Test</div>;
      };

      render(
        <WishlistProvider user={mockUser}>
          <TestComponent />
        </WishlistProvider>
      );

      expect(contextValue.wishlist).toEqual([]);
    });

    it("should load wishlist from localStorage for guest users", () => {
      const storedWishlist = [
        { id: "prod1", productId: "prod1", title: "Product 1", price: 100 },
      ];
      localStorage.getItem.mockReturnValue(JSON.stringify(storedWishlist));

      let contextValue;
      const TestComponent = () => {
        contextValue = React.useContext(WishlistContext);
        return <div>Test</div>;
      };

      render(
        <WishlistProvider user={{ ...mockUser, isGuest: true }}>
          <TestComponent />
        </WishlistProvider>
      );

      expect(contextValue.wishlist).toHaveLength(1);
    });
  });

  describe("toggleWishlistItem", () => {
    it("should add item to wishlist when not present", async () => {
      wishlistService.addToWishlist.mockResolvedValue({
        success: true,
        wishlistItem: { productId: "prod1" },
      });

      let contextValue;
      const TestComponent = () => {
        contextValue = React.useContext(WishlistContext);
        return (
          <button
            onClick={() =>
              contextValue.toggleWishlistItem({
                id: "prod1",
                title: "Test Product",
                price: 100,
              })
            }
          >
            Toggle
          </button>
        );
      };

      render(
        <WishlistProvider user={mockUser}>
          <TestComponent />
        </WishlistProvider>
      );

      const button = screen.getByText("Toggle");
      await userEvent.click(button);

      await waitFor(() => {
        expect(wishlistService.addToWishlist).toHaveBeenCalledWith(
          mockUser._id,
          "prod1"
        );
      });
    });

    it("should remove item from wishlist when already present", async () => {
      wishlistService.getWishlist.mockResolvedValue({
        success: true,
        wishlist: [{ productId: "prod1", product: { _id: "prod1" } }],
      });

      wishlistService.removeFromWishlist.mockResolvedValue({
        success: true,
      });

      let contextValue;
      const TestComponent = () => {
        contextValue = React.useContext(WishlistContext);
        return (
          <button
            onClick={() =>
              contextValue.toggleWishlistItem({
                id: "prod1",
                title: "Test Product",
                price: 100,
              })
            }
          >
            Toggle
          </button>
        );
      };

      render(
        <WishlistProvider user={mockUser}>
          <TestComponent />
        </WishlistProvider>
      );

      const button = screen.getByText("Toggle");

      // Wait for initial load
      await waitFor(() => {
        expect(wishlistService.getWishlist).toHaveBeenCalled();
      });

      // Click to remove
      await userEvent.click(button);

      await waitFor(() => {
        expect(wishlistService.removeFromWishlist).toHaveBeenCalledWith(
          mockUser._id,
          "prod1"
        );
      });
    });
  });

  describe("isInWishlist", () => {
    it("should return true if product is in wishlist", async () => {
      wishlistService.getWishlist.mockResolvedValue({
        success: true,
        wishlist: [{ productId: "prod1", product: { _id: "prod1" } }],
      });

      let contextValue;
      const TestComponent = () => {
        contextValue = React.useContext(WishlistContext);
        return (
          <div>{contextValue.isInWishlist("prod1") ? "In" : "Not In"}</div>
        );
      };

      render(
        <WishlistProvider user={mockUser}>
          <TestComponent />
        </WishlistProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("In")).toBeInTheDocument();
      });
    });

    it("should return false if product is not in wishlist", () => {
      let contextValue;
      const TestComponent = () => {
        contextValue = React.useContext(WishlistContext);
        return (
          <div>{contextValue.isInWishlist("prod999") ? "In" : "Not In"}</div>
        );
      };

      render(
        <WishlistProvider user={mockUser}>
          <TestComponent />
        </WishlistProvider>
      );

      expect(screen.getByText("Not In")).toBeInTheDocument();
    });
  });

  describe("clearWishlist", () => {
    it("should clear all items from wishlist", async () => {
      wishlistService.getWishlist.mockResolvedValue({
        success: true,
        wishlist: [
          { productId: "prod1", product: { _id: "prod1" } },
          { productId: "prod2", product: { _id: "prod2" } },
        ],
      });

      let contextValue;
      const TestComponent = () => {
        contextValue = React.useContext(WishlistContext);
        return (
          <>
            <div>Count: {contextValue.wishlist.length}</div>
            <button onClick={contextValue.clearWishlist}>Clear</button>
          </>
        );
      };

      render(
        <WishlistProvider user={mockUser}>
          <TestComponent />
        </WishlistProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Count: 2")).toBeInTheDocument();
      });

      const clearButton = screen.getByText("Clear");
      await userEvent.click(clearButton);

      await waitFor(() => {
        expect(screen.getByText("Count: 0")).toBeInTheDocument();
      });
    });
  });

  describe("Guest User Behavior", () => {
    it("should use localStorage for guest users", () => {
      const guestUser = { ...mockUser, isGuest: true };

      let contextValue;
      const TestComponent = () => {
        contextValue = React.useContext(WishlistContext);
        return (
          <button
            onClick={() =>
              contextValue.toggleWishlistItem({
                id: "prod1",
                title: "Test Product",
                price: 100,
              })
            }
          >
            Add
          </button>
        );
      };

      render(
        <WishlistProvider user={guestUser}>
          <TestComponent />
        </WishlistProvider>
      );

      const button = screen.getByText("Add");
      userEvent.click(button);

      // Should save to localStorage, not call API
      expect(wishlistService.addToWishlist).not.toHaveBeenCalled();
      expect(localStorage.setItem).toHaveBeenCalled();
    });
  });
});
