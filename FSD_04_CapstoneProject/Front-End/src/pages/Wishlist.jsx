import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import NavBar from "../components/NavBar";
import { WishlistContext } from "../context/WishlistContext";
import { CartContext } from "../context/CartContext";
import { ToastContext } from "../context/ToastContext";
import FavoriteIcon from "@mui/icons-material/Favorite";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";
const PRODUCT_PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80";

const IMAGE_VARIANT_WIDTHS = {
  small: 640,
  medium: 1920,
  large: 2400,
};

const formatINR = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(numeric);
};

const getProductImageSources = (product, preference = "medium") => {
  if (!product) {
    return { src: PRODUCT_PLACEHOLDER_IMAGE, srcSet: "" };
  }

  const variants =
    (product.imageVariants && typeof product.imageVariants === "object"
      ? product.imageVariants
      : {}) || {};

  const preferenceOrder = {
    small: ["small", "medium", "large"],
    medium: ["medium", "large", "small"],
    large: ["large", "medium", "small"],
    default: ["medium", "large", "small"],
  };

  const orderedKeys = preferenceOrder[preference] || preferenceOrder.default;
  const resolvedVariant = orderedKeys.map((key) => variants[key]).find(Boolean);

  const arrayFallback =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images[0]
      : null;

  const src =
    resolvedVariant ||
    arrayFallback ||
    product.image ||
    product.thumbnail ||
    PRODUCT_PLACEHOLDER_IMAGE;

  const srcSet = Object.entries(IMAGE_VARIANT_WIDTHS)
    .map(([key, width]) => {
      const url = variants[key];
      return url ? `${url} ${width}w` : null;
    })
    .filter(Boolean)
    .join(", ");

  return { src, srcSet };
};

const resolveProductId = (product) =>
  product?._id || product?.id || product?.productId || null;

const deriveRatingValue = (product) => {
  const summaryRating = product?.reviewSummary?.averageRating;
  if (typeof summaryRating === "number" && !Number.isNaN(summaryRating)) {
    return summaryRating;
  }
  const directAverage = product?.averageRating ?? product?.rating;
  if (typeof directAverage === "number" && !Number.isNaN(directAverage)) {
    return directAverage;
  }
  return 0;
};

const deriveReviewCount = (product) => {
  if (typeof product?.reviewSummary?.totalReviews === "number") {
    return product.reviewSummary.totalReviews;
  }
  if (typeof product?.reviewCount === "number") {
    return product.reviewCount;
  }
  if (typeof product?.ratingsCount === "number") {
    return product.ratingsCount;
  }
  return 0;
};

const computePricing = (product) => {
  const price = Number(product?.price);
  const discountPrice = Number(product?.discountPrice);

  const current =
    Number.isFinite(discountPrice) && discountPrice > 0 ? discountPrice : price;
  const original =
    Number.isFinite(price) && Number.isFinite(current) && price > current
      ? price
      : null;

  const discountPercent = original
    ? Math.round(((original - current) / original) * 100)
    : 0;

  return {
    current: Number.isFinite(current) && current > 0 ? current : 0,
    original,
    discountPercent,
  };
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f6f9ff 0%, #ffffff 60%)",
  },
  main: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "32px 24px 64px",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "24px",
  },
  title: {
    fontSize: "2rem",
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
  },
  subtitle: {
    margin: 0,
    color: "#64748b",
    fontSize: "0.95rem",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: "20px",
  },
  card: {
    position: "relative",
    background: "#ffffff",
    borderRadius: "20px",
    padding: "20px",
    boxShadow: "0 20px 40px -24px rgba(30, 64, 175, 0.35)",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  emptyState: {
    marginTop: "40px",
    background: "#ffffff",
    borderRadius: "24px",
    padding: "40px",
    textAlign: "center",
    color: "#475569",
    border: "1px dashed rgba(148, 163, 184, 0.4)",
  },
  imageWrapper: {
    width: "100%",
    aspectRatio: "4 / 5",
    background: "#f8fafc",
    borderRadius: "16px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  productTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#0f172a",
    margin: 0,
  },
  productMeta: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.85rem",
    color: "#64748b",
  },
  priceRow: {
    display: "flex",
    alignItems: "baseline",
    gap: "10px",
  },
  priceTag: {
    fontSize: "1.15rem",
    fontWeight: 700,
    color: "#1d4ed8",
  },
  originalPrice: {
    fontSize: "0.9rem",
    color: "#94a3b8",
    textDecoration: "line-through",
  },
  discountBadge: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#16a34a",
    background: "rgba(22, 163, 74, 0.12)",
    padding: "4px 10px",
    borderRadius: "999px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  actions: {
    display: "flex",
    gap: "10px",
  },
  primaryButton: {
    flex: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "10px 16px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #4338ca 0%, #1d4ed8 100%)",
    color: "#ffffff",
    fontWeight: 600,
    border: "none",
    cursor: "pointer",
  },
  secondaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px",
    borderRadius: "12px",
    border: "1px solid rgba(148,163,184,0.4)",
    background: "#f8fafc",
    color: "#0f172a",
    fontWeight: 600,
    minWidth: "88px",
    cursor: "pointer",
  },
  removeButton: {
    position: "absolute",
    top: "12px",
    right: "12px",
    background: "rgba(255,255,255,0.9)",
    borderRadius: "999px",
    border: "1px solid rgba(148, 163, 184, 0.4)",
    padding: "6px",
    color: "#dc2626",
    cursor: "pointer",
  },
  loading: {
    marginTop: "32px",
    color: "#64748b",
  },
  error: {
    marginTop: "32px",
    color: "#dc2626",
  },
};

const Wishlist = ({ user, onLogout }) => {
  const { wishlist, toggleWishlistItem } = useContext(WishlistContext);
  const { addToCart } = useContext(CartContext);
  const { showToast } = useContext(ToastContext);
  const [resolvedProducts, setResolvedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const wishlistIds = useMemo(
    () =>
      wishlist
        .map((entry) => resolveProductId(entry))
        .filter((id, index, arr) => id && arr.indexOf(id) === index),
    [wishlist]
  );

  useEffect(() => {
    let cancelled = false;

    const hydrateWishlistProducts = async () => {
      if (!wishlistIds.length) {
        setResolvedProducts([]);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const results = await Promise.all(
          wishlistIds.map(async (productId) => {
            if (!productId) return null;
            try {
              const response = await fetch(
                `${API_BASE}/api/products/${productId}`
              );
              if (!response.ok) {
                throw new Error(response.statusText || "Failed to fetch");
              }
              const body = await response.json();
              if (body?.success && body.data) {
                return body.data;
              }
            } catch (networkError) {
              console.warn("Failed to hydrate wishlist product", networkError);
            }

            const fallback = wishlist.find((item) => {
              const candidateId = resolveProductId(item);
              return candidateId && candidateId === productId;
            });

            if (!fallback) return null;
            return {
              ...fallback,
              _id: productId,
              id: productId,
              images: fallback.image ? [fallback.image] : [],
              image: fallback.image,
              discountPrice: fallback.price,
            };
          })
        );

        if (cancelled) return;

        const deduped = [];
        const seen = new Set();
        results.filter(Boolean).forEach((product) => {
          const pid = resolveProductId(product);
          if (!pid || seen.has(pid)) return;
          seen.add(pid);
          deduped.push(product);
        });

        setResolvedProducts(deduped);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load wishlist");
          setResolvedProducts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    hydrateWishlistProducts();

    return () => {
      cancelled = true;
    };
  }, [wishlist, wishlistIds]);

  const handleAddToCart = (product) => {
    const pid = resolveProductId(product);
    addToCart({ ...product, id: pid });
    showToast("Item added to cart successfully", { type: "success" });
  };

  const handleToggleWishlist = (product) => {
    const pid = resolveProductId(product);
    const added = toggleWishlistItem({ ...product, id: pid });
    showToast(added ? "Item added to wishlist" : "Item removed from wishlist", {
      type: added ? "success" : "error",
    });
  };

  return (
    <div style={styles.page}>
      <NavBar user={user} onLogout={onLogout} />
      <main style={styles.main}>
        <header style={styles.header}>
          <h1 style={styles.title}>Your wishlist</h1>
          <p style={styles.subtitle}>
            {wishlistIds.length
              ? `You have ${wishlistIds.length} saved item${
                  wishlistIds.length === 1 ? "" : "s"
                } ready to explore.`
              : "Save your favourite products to compare and checkout later."}
          </p>
        </header>

        {loading && <p style={styles.loading}>Loading wishlist…</p>}
        {error && !loading && <p style={styles.error}>{error}</p>}

        {!loading && !error && resolvedProducts.length === 0 && (
          <div style={styles.emptyState}>
            <h2 style={{ marginBottom: "8px", fontSize: "1.4rem" }}>
              Your wishlist is empty
            </h2>
            <p style={{ margin: 0 }}>
              Browse the catalogue and tap the heart icon on products you love.
            </p>
            <Link
              to="/products"
              style={{
                display: "inline-flex",
                marginTop: "18px",
                padding: "10px 18px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #4338ca 0%, #1d4ed8 100%)",
                color: "#ffffff",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Continue shopping
            </Link>
          </div>
        )}

        {!loading && !error && resolvedProducts.length > 0 && (
          <section style={styles.cardGrid}>
            {resolvedProducts.map((product) => {
              const pid = resolveProductId(product);
              const { src, srcSet } = getProductImageSources(product, "medium");
              const pricing = computePricing(product);
              const rating = deriveRatingValue(product);
              const reviewCount = deriveReviewCount(product);

              return (
                <article key={pid} style={styles.card}>
                  <button
                    type="button"
                    onClick={() => handleToggleWishlist(product)}
                    style={styles.removeButton}
                    aria-label={`Remove ${
                      product.title || "product"
                    } from wishlist`}
                  >
                    <FavoriteIcon fontSize="small" />
                  </button>

                  <Link
                    to={`/products/${pid}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <div style={styles.imageWrapper}>
                      <img
                        src={src}
                        srcSet={srcSet || undefined}
                        sizes="(max-width: 768px) 45vw, 240px"
                        alt={product.title || "Product image"}
                        loading="lazy"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                    <h2 style={styles.productTitle}>{product.title}</h2>
                  </Link>

                  <div style={styles.productMeta}>
                    {rating > 0 ? (
                      <span aria-label={`Rated ${rating.toFixed(1)} out of 5`}>
                        ⭐ {rating.toFixed(1)}
                        {reviewCount > 0 && ` (${reviewCount})`}
                      </span>
                    ) : (
                      <span>No ratings yet</span>
                    )}
                  </div>

                  <div style={styles.priceRow}>
                    <span style={styles.priceTag}>
                      {formatINR(pricing.current)}
                    </span>
                    {pricing.original && (
                      <span style={styles.originalPrice}>
                        {formatINR(pricing.original)}
                      </span>
                    )}
                    {pricing.discountPercent > 0 && (
                      <span style={styles.discountBadge}>
                        Save {pricing.discountPercent}%
                      </span>
                    )}
                  </div>

                  <div style={styles.actions}>
                    <button
                      type="button"
                      style={styles.primaryButton}
                      onClick={() => handleAddToCart(product)}
                    >
                      Add to cart
                    </button>
                    <button
                      type="button"
                      style={styles.secondaryButton}
                      onClick={() => handleToggleWishlist(product)}
                    >
                      Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
};

export default Wishlist;
