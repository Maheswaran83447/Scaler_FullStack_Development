import React, { createContext, useState, useEffect, useCallback } from "react";
import cartService from "../services/cartService";
import authService from "../services/authService";

export const CartContext = createContext();

const STORAGE_KEY = "fsd_cart_v1";

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Helper to check if user is logged in
  const isLoggedIn = useCallback(() => {
    const user = authService.getCurrentUser();
    return user && !user.isGuest;
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      // ignore
    }
  }, [cart]);

  // Fetch cart from server on mount if logged in
  useEffect(() => {
    const fetchServerCart = async () => {
      if (!isLoggedIn()) return;

      try {
        setIsSyncing(true);
        const response = await cartService.getCart();

        if (response.success && response.cart && response.cart.items) {
          // Convert server cart format to local cart format
          const serverCart = response.cart.items.map((item) => ({
            id: item.productId._id || item.productId,
            title: item.productId.title,
            price: item.productId.price,
            discountPrice: item.productId.discountPrice,
            images: item.productId.images,
            quantity: item.quantity,
          }));

          // Merge with localStorage cart
          const localCart = cart;
          const mergedCart = [...serverCart];

          // Add items from localStorage that aren't in server cart
          localCart.forEach((localItem) => {
            const existsInServer = mergedCart.find(
              (serverItem) => serverItem.id === localItem.id
            );
            if (!existsInServer) {
              mergedCart.push(localItem);
            }
          });

          setCart(mergedCart);

          // If there were items in localStorage, sync them to server
          if (localCart.length > 0) {
            const itemsToSync = localCart.map((item) => ({
              productId: item.id,
              quantity: item.quantity,
            }));
            await cartService.syncCart(itemsToSync);
          }
        }
      } catch (error) {
        console.error("Failed to fetch server cart:", error);
        // Keep using localStorage cart on error
      } finally {
        setIsSyncing(false);
      }
    };

    fetchServerCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const addToCart = async (product, qty = 1) => {
    // Update local state immediately
    setCart((prev) => {
      const idx = prev.findIndex((it) => it.id === product.id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx].quantity += qty;
        return copy;
      }
      return [...prev, { ...product, quantity: qty }];
    });

    // Sync to server if logged in
    if (isLoggedIn()) {
      try {
        await cartService.addItemToCart(product.id, qty);
      } catch (error) {
        console.error("Failed to sync cart to server:", error);
        // Local cart is already updated, so user experience isn't blocked
      }
    }
  };

  const removeFromCart = async (productId) => {
    // Update local state immediately
    setCart((prev) => prev.filter((it) => it.id !== productId));

    // Sync to server if logged in
    if (isLoggedIn()) {
      try {
        await cartService.removeCartItem(productId);
      } catch (error) {
        console.error("Failed to remove item from server cart:", error);
      }
    }
  };

  const updateQuantity = async (productId, quantity) => {
    // Update local state immediately
    setCart((prev) => {
      const copy = prev.map((it) => {
        if (it.id !== productId) return it;
        const normalized = Number(quantity);
        const safeQuantity = Number.isFinite(normalized)
          ? Math.max(0, normalized)
          : 0;
        return { ...it, quantity: safeQuantity };
      });
      return copy.filter((it) => (it.quantity || 0) > 0);
    });

    // Sync to server if logged in
    if (isLoggedIn()) {
      try {
        await cartService.updateCartItem(productId, quantity);
      } catch (error) {
        console.error("Failed to update item quantity on server:", error);
      }
    }
  };

  const clearCart = async () => {
    // Update local state immediately
    setCart([]);

    // Sync to server if logged in
    if (isLoggedIn()) {
      try {
        await cartService.clearCart();
      } catch (error) {
        console.error("Failed to clear cart on server:", error);
      }
    }
  };

  const cartCount = cart.reduce((s, it) => s + (it.quantity || 0), 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        isSyncing,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;
