import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

export const WishlistContext = createContext({
  wishlist: [],
  isInWishlist: () => false,
  toggleWishlistItem: () => false,
  clearWishlist: () => {},
});

const STORAGE_KEY = "fsd_wishlist_v1";

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn("Failed to read wishlist from storage", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
    } catch (error) {
      console.warn("Failed to persist wishlist", error);
    }
  }, [wishlist]);

  const isInWishlist = useCallback(
    (id) => wishlist.some((item) => item.id === id),
    [wishlist]
  );

  const toggleWishlistItem = useCallback((item) => {
    if (!item?.id) return false;
    let added = false;

    setWishlist((prev) => {
      const exists = prev.some((entry) => entry.id === item.id);
      if (exists) {
        added = false;
        return prev.filter((entry) => entry.id !== item.id);
      }

      const entry = {
        id: item.id,
        title: item.title || item.name || "Wishlist item",
        price: item.price || 0,
      };
      added = true;
      return [...prev, entry];
    });

    return added;
  }, []);

  const clearWishlist = useCallback(() => {
    setWishlist([]);
  }, []);

  const contextValue = useMemo(
    () => ({
      wishlist,
      isInWishlist,
      toggleWishlistItem,
      clearWishlist,
    }),
    [wishlist, isInWishlist, toggleWishlistItem, clearWishlist]
  );

  return (
    <WishlistContext.Provider value={contextValue}>
      {children}
    </WishlistContext.Provider>
  );
};

export default WishlistProvider;
