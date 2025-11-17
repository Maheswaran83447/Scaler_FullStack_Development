import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import wishlistService from "../services/wishlistService";

export const WishlistContext = createContext({
  wishlist: [],
  isInWishlist: () => false,
  toggleWishlistItem: () => false,
  clearWishlist: () => {},
});

const STORAGE_KEY = "fsd_wishlist_v1";

const resolveUserId = (user) => {
  const rawId = user?.id || user?._id || user?.userId;
  if (!rawId) return null;
  const stringId = String(rawId);
  return /^[a-f\d]{24}$/i.test(stringId) ? stringId : null;
};

const normalizeWishlistEntry = (item) => {
  if (!item) return null;
  const product = item.product || item;
  const productId =
    item.productId || product?.id || product?._id || item.id || item._id;
  if (!productId) return null;

  return {
    id: String(productId),
    productId: String(productId),
    title: product?.title || item.title || "Wishlist item",
    price: product?.discountPrice ?? product?.price ?? item.price ?? 0,
    image: Array.isArray(product?.images) ? product.images[0] : null,
  };
};

export const WishlistProvider = ({ children, user }) => {
  const userId = useMemo(() => resolveUserId(user), [user]);
  const isLoggedIn = Boolean(userId);
  const isGuest = Boolean(user?.isGuest);

  const readLocalWishlist = useCallback(() => {
    try {
      if (typeof window === "undefined") return [];
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((entry) => normalizeWishlistEntry(entry))
        .filter(Boolean);
    } catch (error) {
      console.warn("Failed to read wishlist from storage", error);
      return [];
    }
  }, []);

  const [wishlist, setWishlist] = useState(readLocalWishlist);

  const syncWishlistFromServer = useCallback(async (targetUserId) => {
    if (!targetUserId) return;
    try {
      const response = await wishlistService.list(targetUserId);
      if (response?.success && Array.isArray(response.data)) {
        setWishlist(
          response.data
            .map((entry) => normalizeWishlistEntry(entry))
            .filter(Boolean)
        );
      } else {
        setWishlist([]);
      }
    } catch (error) {
      console.warn("Failed to load wishlist", error);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn && userId) {
      syncWishlistFromServer(userId);
    } else if (isGuest) {
      setWishlist([]);
    } else {
      setWishlist(readLocalWishlist());
    }
  }, [isLoggedIn, isGuest, userId, syncWishlistFromServer, readLocalWishlist]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isLoggedIn) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.warn("Failed to clear wishlist storage", error);
      }
      return;
    }
    if (isGuest) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
    } catch (error) {
      console.warn("Failed to persist wishlist", error);
    }
  }, [wishlist, isLoggedIn, isGuest]);

  const isInWishlist = useCallback(
    (id) => wishlist.some((item) => item.id === id || item.productId === id),
    [wishlist]
  );

  const toggleWishlistItem = useCallback(
    (item) => {
      const productId =
        item?.id || item?._id || item?.productId || item?.product?.id;
      if (!productId) return false;

      if (!isLoggedIn || isGuest) {
        let added = false;
        setWishlist((prev) => {
          const exists = prev.some((entry) => entry.id === String(productId));
          if (exists) {
            added = false;
            return prev.filter((entry) => entry.id !== String(productId));
          }
          const entry = normalizeWishlistEntry({ ...item, productId });
          added = true;
          return [...prev, entry];
        });
        return added;
      }

      const alreadyInWishlist = isInWishlist(String(productId));
      const previous = wishlist;

      if (alreadyInWishlist) {
        setWishlist((prev) =>
          prev.filter((entry) => entry.id !== String(productId))
        );
        wishlistService
          .remove(userId, productId)
          .then(() => syncWishlistFromServer(userId))
          .catch((error) => {
            console.warn("Failed to remove wishlist item", error);
            setWishlist(previous);
          });
        return false;
      }

      const optimisticEntry = normalizeWishlistEntry({ ...item, productId });
      setWishlist((prev) => [...prev, optimisticEntry]);

      wishlistService
        .add(userId, productId)
        .then((response) => {
          if (response?.success && response.data) {
            const entry = normalizeWishlistEntry(response.data);
            if (entry) {
              setWishlist((prev) => {
                const withoutCurrent = prev.filter(
                  (existing) => existing.id !== String(productId)
                );
                return [...withoutCurrent, entry];
              });
              return;
            }
          }
          syncWishlistFromServer(userId);
        })
        .catch((error) => {
          console.warn("Failed to add wishlist item", error);
          setWishlist(previous);
        });
      return true;
    },
    [
      isLoggedIn,
      isGuest,
      isInWishlist,
      wishlist,
      userId,
      syncWishlistFromServer,
    ]
  );

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
