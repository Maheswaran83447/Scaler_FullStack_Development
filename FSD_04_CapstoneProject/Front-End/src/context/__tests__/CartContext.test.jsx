import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartProvider, CartContext } from "../CartContext";
import cartService from "../../services/cartService";
import authService from "../../services/authService";

// Mock the services
vi.mock("../../services/cartService", () => ({
  default: {
    getCart: vi.fn(),
    addItemToCart: vi.fn(),
    updateCartItem: vi.fn(),
    removeCartItem: vi.fn(),
    clearCart: vi.fn(),
    syncCart: vi.fn(),
  },
}));

vi.mock("../../services/authService", () => ({
  default: {
    getCurrentUser: vi.fn(),
  },
}));

describe("CartContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    authService.getCurrentUser.mockReturnValue({
      _id: "user123",
      email: "test@example.com",
      isGuest: false,
    });
  });

  describe("Cart Initialization", () => {
    it("should initialize with empty cart", () => {
      let contextValue;
      const TestComponent = () => {
        contextValue = React.useContext(CartContext);
        return <div>Cart Count: {contextValue.cart.length}</div>;
      };

      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      );

      expect(screen.getByText("Cart Count: 0")).toBeInTheDocument();
    });

    it("should load cart from localStorage on mount", () => {
      const storedCart = [
        { id: "prod1", title: "Product 1", price: 100, quantity: 2 },
      ];
      localStorage.getItem.mockReturnValue(JSON.stringify(storedCart));

      let contextValue;
      const TestComponent = () => {
        contextValue = React.useContext(CartContext);
        return <div>Cart Count: {contextValue.cart.length}</div>;
      };

      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      );

      expect(screen.getByText("Cart Count: 1")).toBeInTheDocument();
    });
  });

  describe("addToCart", () => {
    it("should add new item to cart", async () => {
      cartService.addItemToCart.mockResolvedValue({
        success: true,
        cart: {
          items: [
            {
              productId: { _id: "prod1", title: "Product 1", price: 100 },
              quantity: 1,
            },
          ],
        },
      });

      let contextValue;
      const TestComponent = () => {
        contextValue = React.useContext(CartContext);
        return (
          <button
            onClick={() =>
              contextValue.addToCart("prod1", "Product 1", 100, 1, null)
            }
          >
            Add to Cart
          </button>
        );
      };

      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      );

      const button = screen.getByText("Add to Cart");
      await userEvent.click(button);

      await waitFor(() => {
        expect(cartService.addItemToCart).toHaveBeenCalledWith("prod1", 1);
      });
    });

    it("should increment quantity if item already in cart", async () => {
      const existingCart = [
        { id: "prod1", title: "Product 1", price: 100, quantity: 1 },
      ];
      localStorage.getItem.mockReturnValue(JSON.stringify(existingCart));

      cartService.updateCartItem.mockResolvedValue({
        success: true,
        cart: {
          items: [
            {
              productId: { _id: "prod1", title: "Product 1", price: 100 },
              quantity: 2,
            },
          ],
        },
      });

      let contextValue;
      const TestComponent = () => {
        contextValue = React.useContext(CartContext);
        return (
          <>
            <div>Quantity: {contextValue.cart[0]?.quantity || 0}</div>
            <button
              onClick={() =>
                contextValue.addToCart("prod1", "Product 1", 100, 1, null)
              }
            >
              Add Again
            </button>
          </>
        );
      };

      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      );

      expect(screen.getByText("Quantity: 1")).toBeInTheDocument();

      const button = screen.getByText("Add Again");
      await userEvent.click(button);

      await waitFor(() => {
        expect(cartService.updateCartItem).toHaveBeenCalled();
      });
    });
  });

  describe("updateQuantity", () => {
    it("should update item quantity", async () => {
      const cart = [
        { id: "prod1", title: "Product 1", price: 100, quantity: 2 },
      ];
      localStorage.getItem.mockReturnValue(JSON.stringify(cart));

      cartService.updateCartItem.mockResolvedValue({
        success: true,
        cart: {
          items: [
            {
              productId: { _id: "prod1", title: "Product 1", price: 100 },
              quantity: 5,
            },
          ],
        },
      });

      let contextValue;
      const TestComponent = () => {
        contextValue = React.useContext(CartContext);
        return (
          <button onClick={() => contextValue.updateQuantity("prod1", 5)}>
            Update to 5
          </button>
        );
      };

      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      );

      const button = screen.getByText("Update to 5");
      await userEvent.click(button);

      await waitFor(() => {
        expect(cartService.updateCartItem).toHaveBeenCalledWith("prod1", 5);
      });
    });

    it("should remove item when quantity is 0", async () => {
      const cart = [
        { id: "prod1", title: "Product 1", price: 100, quantity: 1 },
      ];
      localStorage.getItem.mockReturnValue(JSON.stringify(cart));

      cartService.removeCartItem.mockResolvedValue({
        success: true,
      });

      let contextValue;
      const TestComponent = () => {
        contextValue = React.useContext(CartContext);
        return (
          <>
            <div>Count: {contextValue.cart.length}</div>
            <button onClick={() => contextValue.updateQuantity("prod1", 0)}>
              Remove
            </button>
          </>
        );
      };

      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      );

      expect(screen.getByText("Count: 1")).toBeInTheDocument();

      const button = screen.getByText("Remove");
      await userEvent.click(button);

      await waitFor(() => {
        expect(cartService.removeCartItem).toHaveBeenCalledWith("prod1");
        expect(screen.getByText("Count: 0")).toBeInTheDocument();
      });
    });
  });

  describe("removeFromCart", () => {
    it("should remove item from cart", async () => {
      const cart = [
        { id: "prod1", title: "Product 1", price: 100, quantity: 1 },
        { id: "prod2", title: "Product 2", price: 200, quantity: 1 },
      ];
      localStorage.getItem.mockReturnValue(JSON.stringify(cart));

      cartService.removeCartItem.mockResolvedValue({
        success: true,
      });

      let contextValue;
      const TestComponent = () => {
        contextValue = React.useContext(CartContext);
        return (
          <>
            <div>Count: {contextValue.cart.length}</div>
            <button onClick={() => contextValue.removeFromCart("prod1")}>
              Remove
            </button>
          </>
        );
      };

      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      );

      expect(screen.getByText("Count: 2")).toBeInTheDocument();

      const button = screen.getByText("Remove");
      await userEvent.click(button);

      await waitFor(() => {
        expect(cartService.removeCartItem).toHaveBeenCalledWith("prod1");
        expect(screen.getByText("Count: 1")).toBeInTheDocument();
      });
    });
  });

  describe("clearCart", () => {
    it("should clear all items from cart", async () => {
      const cart = [
        { id: "prod1", title: "Product 1", price: 100, quantity: 1 },
        { id: "prod2", title: "Product 2", price: 200, quantity: 1 },
      ];
      localStorage.getItem.mockReturnValue(JSON.stringify(cart));

      cartService.clearCart.mockResolvedValue({
        success: true,
        cart: { items: [] },
      });

      let contextValue;
      const TestComponent = () => {
        contextValue = React.useContext(CartContext);
        return (
          <>
            <div>Count: {contextValue.cart.length}</div>
            <button onClick={contextValue.clearCart}>Clear</button>
          </>
        );
      };

      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      );

      expect(screen.getByText("Count: 2")).toBeInTheDocument();

      const button = screen.getByText("Clear");
      await userEvent.click(button);

      await waitFor(() => {
        expect(cartService.clearCart).toHaveBeenCalled();
        expect(screen.getByText("Count: 0")).toBeInTheDocument();
      });
    });
  });

  describe("Cart Calculations", () => {
    it("should calculate total items correctly", () => {
      const cart = [
        { id: "prod1", title: "Product 1", price: 100, quantity: 2 },
        { id: "prod2", title: "Product 2", price: 200, quantity: 3 },
      ];
      localStorage.getItem.mockReturnValue(JSON.stringify(cart));

      let contextValue;
      const TestComponent = () => {
        contextValue = React.useContext(CartContext);
        return <div>Total Items: {contextValue.totalItems}</div>;
      };

      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      );

      expect(screen.getByText("Total Items: 5")).toBeInTheDocument();
    });

    it("should calculate total price correctly", () => {
      const cart = [
        { id: "prod1", title: "Product 1", price: 100, quantity: 2 },
        { id: "prod2", title: "Product 2", price: 200, quantity: 1 },
      ];
      localStorage.getItem.mockReturnValue(JSON.stringify(cart));

      let contextValue;
      const TestComponent = () => {
        contextValue = React.useContext(CartContext);
        return <div>Total: ₹{contextValue.total}</div>;
      };

      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      );

      expect(screen.getByText("Total: ₹400")).toBeInTheDocument();
    });
  });
});
