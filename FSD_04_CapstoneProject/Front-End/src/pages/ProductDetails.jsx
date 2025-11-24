import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import NavBar from "../components/NavBar";
import { CartContext } from "../context/CartContext";
import { ToastContext } from "../context/ToastContext";
import { WishlistContext } from "../context/WishlistContext";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import PaymentsIcon from "@mui/icons-material/Payments";
import ReplayIcon from "@mui/icons-material/Replay";
import VerifiedIcon from "@mui/icons-material/Verified";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";
const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    n
  );
const PRODUCT_PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80";

const formatCount = (value) =>
  new Intl.NumberFormat("en-IN", { notation: "compact" }).format(
    Math.max(0, value || 0)
  );

const formatReviewDate = (value) => {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
    }).format(new Date(value));
  } catch (error) {
    return "";
  }
};

const IMAGE_VARIANT_WIDTHS = {
  small: 640,
  medium: 1920,
  large: 2400,
};

const getProductImageSources = (product, preference = "large") => {
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

const deriveSellerName = (product) => {
  if (!product) return "Marketplace Seller";
  if (product.sellerName) return product.sellerName;
  if (product.brand) return product.brand;
  if (product.brandName) return product.brandName;
  if (product.storeName) return product.storeName;
  if (
    product.seller &&
    typeof product.seller === "object" &&
    (product.seller.storeName || product.seller.name)
  ) {
    return product.seller.storeName || product.seller.name;
  }
  return "Marketplace Seller";
};

const normaliseLabelFromKey = (rawKey = "") => {
  if (typeof rawKey !== "string") return "";
  return rawKey
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
};

const formatDetailValue = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => formatDetailValue(item))
      .filter((item) => item && item.length)
      .join(", ");
  }
  if (value instanceof Date) {
    return value.toLocaleDateString();
  }
  if (typeof value === "object") {
    return Object.values(value)
      .map((item) => formatDetailValue(item))
      .filter((item) => item && item.length)
      .join(", ");
  }
  return String(value).trim();
};

const buildProductDetailEntries = (product, sellerName) => {
  if (!product) return [];

  const entries = [];
  const seen = new Set();
  const pushEntry = (label, value) => {
    if (!label) return;
    const formattedValue = formatDetailValue(value);
    if (!formattedValue) return;
    const key = label.trim().toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    entries.push({ label, value: formattedValue });
  };

  const detailCandidates = [
    product.productDetails,
    product.details,
    product.specifications,
    product.specification,
    product.metadata,
  ];

  let detailObject = {};
  const detailArrays = [];

  detailCandidates.forEach((candidate) => {
    if (!candidate) return;
    if (Array.isArray(candidate)) {
      detailArrays.push(candidate);
    } else if (typeof candidate === "object") {
      detailObject = { ...detailObject, ...candidate };
    }
  });

  Object.entries(detailObject).forEach(([key, value]) => {
    pushEntry(normaliseLabelFromKey(key), value);
  });

  detailArrays.forEach((collection) => {
    collection.forEach((item) => {
      if (!item) return;
      if (typeof item === "string") {
        return;
      }
      const label =
        item.label ||
        item.title ||
        item.name ||
        normaliseLabelFromKey(item.key || item.id || "");
      const value =
        item.value || item.content || item.text || item.description || null;
      pushEntry(label, value);
    });
  });

  const fallbackPairs = [
    ["Brand", product.brand || product.brandName || product.manufacturer],
    ["Seller", sellerName],
    ["Category", product.category],
    ["SKU", product.sku],
    ["Model number", detailObject.itemModelNumber || product.modelNumber],
    ["Manufacturer", detailObject.manufacturer || product.manufacturer],
    [
      "Country of origin",
      detailObject.countryOfOrigin || product.countryOfOrigin,
    ],
    ["Net quantity", detailObject.netQuantity || product.netQuantity],
    [
      "Product dimensions",
      detailObject.productDimensions ||
        product.productDimensions ||
        product.dimensions,
    ],
    ["ASIN", detailObject.asin || product.asin],
    [
      "In stock",
      typeof product.stock === "number"
        ? `${product.stock} ${product.stock === 1 ? "unit" : "units"}`
        : product.stock,
    ],
    ["Warranty", product.warranty],
  ];

  fallbackPairs.forEach(([label, value]) => pushEntry(label, value));

  return entries;
};

const ProductDetails = ({ user, onLogout }) => {
  const { id } = useParams();
  const { addToCart } = useContext(CartContext);
  const { showToast } = useContext(ToastContext);
  const { isInWishlist, toggleWishlistItem } = useContext(WishlistContext);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [recentReviews, setRecentReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    setProduct(null);
    setReviewSummary(null);
    setRecentReviews([]);
    setShowReviewForm(false);
    setReviewText("");
    setReviewRating(5);
    fetch(`${API_BASE}/api/products/${id}`)
      .then((res) => res.json())
      .then((body) => {
        if (!mounted) return;
        if (body && body.success) {
          const productData = body.data || null;
          setProduct(productData);
          setReviewSummary(productData?.reviewSummary || null);
          setRecentReviews(productData?.recentReviews || []);
        } else setError(body?.message || "Product not found");
      })
      .catch((err) => mounted && setError(err.message || "Failed to load"))
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, [id]);

  if (loading) {
    return (
      <div>
        <NavBar user={user} onLogout={onLogout} />
        <main className="product-detail-page">
          <p>Loading…</p>
        </main>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div>
        <NavBar user={user} onLogout={onLogout} />
        <main className="product-detail-page">
          <p style={{ color: "red" }}>{error || "Product not found."}</p>
        </main>
      </div>
    );
  }

  const pid = product._id || product.id;
  const { src: imageSrc, srcSet: imageSrcSet } = getProductImageSources(
    product,
    "large"
  );
  const preferredImageSrc =
    (product.imageVariants && product.imageVariants.large) || imageSrc;
  const preferredImageSrcSet =
    product.imageVariants && product.imageVariants.large
      ? `${product.imageVariants.large} ${IMAGE_VARIANT_WIDTHS.large}w`
      : imageSrcSet || undefined;
  const summaryAverage =
    typeof reviewSummary?.averageRating === "number" &&
    !Number.isNaN(reviewSummary?.averageRating)
      ? reviewSummary.averageRating
      : null;
  const totalReviews = reviewSummary?.totalReviews || 0;
  const ratingValue =
    summaryAverage !== null
      ? summaryAverage
      : typeof product.rating === "number" && !Number.isNaN(product.rating)
      ? product.rating
      : 0;
  const reviewCount =
    totalReviews ||
    Math.max(0, product.reviewCount || product.ratingsCount || 0);
  const ratingDistribution = reviewSummary?.distribution || {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  const sellerName = deriveSellerName(product);
  const detailEntries = buildProductDetailEntries(product, sellerName);
  const descriptionHtml = product.productDescription?.descriptionHtml;
  const serviceHighlights = [
    { id: "pod", Icon: PaymentsIcon, label: "Pay on delivery" },
    { id: "return", Icon: ReplayIcon, label: "10 days returnable" },
    { id: "cartify", Icon: VerifiedIcon, label: "Cartify delivered" },
    { id: "warranty", Icon: WorkspacePremiumIcon, label: "2 year warranty" },
    { id: "delivery", Icon: LocalShippingIcon, label: "Free delivery" },
  ];
  const starValues = [1, 2, 3, 4, 5];
  const renderStaticStars = (value) =>
    starValues.map((star) => (
      <span key={star} className="product-detail-review-star-icon">
        {value >= star - 0.25 ? (
          <StarIcon fontSize="inherit" />
        ) : (
          <StarBorderIcon fontSize="inherit" />
        )}
      </span>
    ));
  const handleAddToCart = () => {
    addToCart({ ...product, id: pid });
    showToast("Item added to cart successfully", { type: "success" });
  };

  const handleToggleWishlist = () => {
    const added = toggleWishlistItem({ ...product, id: pid });
    showToast(added ? "Item added to wishlist" : "Item removed from wishlist", {
      type: added ? "success" : "error",
    });
  };

  const handleReviewToggle = () => {
    setShowReviewForm((prev) => !prev);
  };

  const handleRatingSelect = (value) => {
    setReviewRating(value);
  };

  const handleSubmitReview = (event) => {
    event.preventDefault();
    if (submittingReview) return;

    const trimmed = reviewText.trim();
    if (trimmed.length < 10) {
      showToast("Please share at least 10 characters for your review.", {
        type: "error",
      });
      return;
    }

    setSubmittingReview(true);
    fetch(`${API_BASE}/api/products/${pid}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating: reviewRating,
        comment: trimmed,
        displayName: user?.name || user?.fullName || "Cartify Shopper",
      }),
    })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok || !body?.success) {
          throw new Error(body?.message || "Failed to submit review");
        }
        setReviewSummary(body.meta?.reviewSummary || null);
        setRecentReviews(body.meta?.recentReviews || []);
        setReviewText("");
        setReviewRating(5);
        setShowReviewForm(false);
        showToast("Thanks for sharing your review!", { type: "success" });
      })
      .catch((submitError) => {
        showToast(
          submitError.message || "Failed to submit review. Please try again.",
          { type: "error" }
        );
      })
      .finally(() => setSubmittingReview(false));
  };

  const hasReviews = totalReviews > 0;

  return (
    <div>
      <NavBar user={user} onLogout={onLogout} />
      <main className="product-detail-page">
        <div className="product-detail-container">
          <div className="product-detail-grid">
            <div className="product-detail-info">
              <div className="product-detail-header">
                <h1 className="product-detail-title">{product.title}</h1>
                <button
                  type="button"
                  className={`wishlist-toggle ${
                    isInWishlist(pid) ? "active" : ""
                  }`}
                  aria-label={
                    isInWishlist(pid)
                      ? "Remove from wishlist"
                      : "Add to wishlist"
                  }
                  aria-pressed={isInWishlist(pid)}
                  onClick={handleToggleWishlist}
                >
                  {isInWishlist(pid) ? (
                    <FavoriteIcon fontSize="inherit" />
                  ) : (
                    <FavoriteBorderIcon fontSize="inherit" />
                  )}
                </button>
              </div>

              <p className="product-detail-seller">
                <span className="product-detail-meta-label">Sold by:</span>
                <span className="product-detail-meta-value">{sellerName}</span>
              </p>

              <div
                className="product-detail-rating"
                aria-label="Product rating"
              >
                <span className="product-detail-rating-label">Rating:</span>
                <span className="product-detail-rating-score">
                  {ratingValue.toFixed(1)} / 5
                </span>
                <span className="product-detail-rating-count">
                  {formatCount(reviewCount)} ratings
                </span>
              </div>

              <div className="product-detail-price">
                <span className="product-detail-price-current">
                  {formatINR(
                    product.discountPrice &&
                      product.discountPrice < product.price
                      ? product.discountPrice
                      : product.price
                  )}
                </span>
                {product.discountPrice &&
                  product.discountPrice < product.price && (
                    <span className="product-detail-price-original">
                      {formatINR(product.price)}
                    </span>
                  )}
              </div>

              <p className="product-detail-price-note">
                Inclusive of all taxes · EMI options available
              </p>

              <div className="product-detail-service-strip">
                {serviceHighlights.map(({ id: serviceId, Icon, label }) => (
                  <div key={serviceId} className="product-detail-service-item">
                    <Icon className="product-detail-service-icon" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              <hr className="product-detail-full-divider" />

              {product.description && (
                <p className="product-detail-description">
                  {product.description}
                </p>
              )}

              <div className="product-detail-actions">
                <button
                  onClick={handleAddToCart}
                  className="product-detail-add-to-cart"
                >
                  Add to cart
                </button>
              </div>
            </div>

            <div className="product-detail-media">
              <img
                src={preferredImageSrc}
                srcSet={preferredImageSrcSet}
                alt={product.title || "Product image"}
                className="product-detail-image"
                loading="lazy"
              />
            </div>
          </div>
          <hr className="product-detail-section-divider" />
          {descriptionHtml && (
            <section
              className="product-detail-description-section"
              aria-labelledby="product-description-heading"
            >
              <div className="product-detail-spec-header">
                <h2
                  id="product-description-heading"
                  className="product-detail-spec-title"
                >
                  Product description
                </h2>
                <p className="product-detail-spec-subtitle">
                  Immersive story, standout highlights, and everyday use cases
                  tailored for {product.title}.
                </p>
              </div>
              <div
                className="product-detail-description-rich"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            </section>
          )}
          <hr className="product-detail-section-divider" />
          <section
            className="product-detail-review-section"
            aria-labelledby="product-reviews-heading"
          >
            <div className="product-detail-spec-header">
              <h2
                id="product-reviews-heading"
                className="product-detail-spec-title"
              >
                Customer reviews
              </h2>
              <p className="product-detail-spec-subtitle">
                See how Cartify shoppers are experiencing {product.title}.
              </p>
            </div>
            <div className="product-detail-review-grid">
              <aside className="product-detail-review-summary">
                <div className="product-detail-review-score">
                  <span className="product-detail-review-score-number">
                    {ratingValue.toFixed(1)}
                  </span>
                  <div className="product-detail-review-stars">
                    {renderStaticStars(ratingValue)}
                  </div>
                  <p className="product-detail-review-score-caption">
                    {hasReviews
                      ? `${formatCount(totalReviews)} verified review${
                          totalReviews === 1 ? "" : "s"
                        }`
                      : "Be the first to review"}
                  </p>
                </div>
                <div className="product-detail-review-distribution">
                  {[...starValues].reverse().map((star) => {
                    const count = ratingDistribution[star] || 0;
                    const percentage = hasReviews
                      ? Math.round((count / totalReviews) * 100)
                      : 0;
                    return (
                      <div
                        key={star}
                        className="product-detail-review-distribution-row"
                      >
                        <span className="product-detail-review-distribution-label">
                          {star}★
                        </span>
                        <div
                          className="product-detail-review-progress"
                          role="progressbar"
                          aria-valuenow={percentage}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${count} review${
                            count === 1 ? "" : "s"
                          } with ${star} star rating`}
                        >
                          <div
                            className="product-detail-review-progress-fill"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="product-detail-review-distribution-count">
                          {formatCount(count)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  className="product-detail-review-cta"
                  onClick={handleReviewToggle}
                >
                  {showReviewForm
                    ? "Close review form"
                    : "Write a product review"}
                </button>
              </aside>
              <div className="product-detail-review-feed">
                {showReviewForm && (
                  <form
                    className="product-detail-review-form"
                    onSubmit={handleSubmitReview}
                  >
                    <div className="product-detail-review-avatar">
                      <PersonOutlineIcon fontSize="large" />
                    </div>
                    <div className="product-detail-review-form-body">
                      <div
                        className="product-detail-review-rating-input"
                        role="radiogroup"
                        aria-label="Select a rating"
                      >
                        {starValues.map((star) => (
                          <button
                            key={star}
                            type="button"
                            className={`product-detail-review-star-button ${
                              reviewRating >= star ? "is-active" : ""
                            }`}
                            onClick={() => handleRatingSelect(star)}
                            aria-label={`${star} star${star > 1 ? "s" : ""}`}
                          >
                            {reviewRating >= star ? (
                              <StarIcon fontSize="inherit" />
                            ) : (
                              <StarBorderIcon fontSize="inherit" />
                            )}
                          </button>
                        ))}
                      </div>
                      <textarea
                        className="product-detail-review-textarea"
                        placeholder="Share how this product fits into your day-to-day rituals..."
                        value={reviewText}
                        onChange={(event) => setReviewText(event.target.value)}
                        minLength={10}
                        maxLength={2000}
                        required
                      />
                      <div className="product-detail-review-form-actions">
                        <button
                          type="submit"
                          className="product-detail-review-submit"
                          disabled={submittingReview}
                        >
                          {submittingReview ? "Submitting…" : "Submit review"}
                        </button>
                        <button
                          type="button"
                          className="product-detail-review-cancel"
                          onClick={() => setShowReviewForm(false)}
                          disabled={submittingReview}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                )}
                {hasReviews && recentReviews.length > 0 ? (
                  recentReviews.map((review) => (
                    <article
                      key={review.id || review._id}
                      className="product-detail-review-card"
                    >
                      <header className="product-detail-review-card-header">
                        <div className="product-detail-review-card-meta">
                          <span className="product-detail-review-card-author">
                            {review.displayName || "Cartify Shopper"}
                          </span>
                          <span className="product-detail-review-card-date">
                            {formatReviewDate(review.createdAt)}
                          </span>
                        </div>
                        <div className="product-detail-review-card-rating">
                          {renderStaticStars(review.rating)}
                        </div>
                      </header>
                      <p className="product-detail-review-card-body">
                        {review.comment}
                      </p>
                    </article>
                  ))
                ) : (
                  <p className="product-detail-review-empty">
                    Be the first to share a story about {product.title}. Tap
                    “Write a product review” to get started.
                  </p>
                )}
              </div>
            </div>
          </section>
          <hr className="product-detail-section-divider" />
          <section
            className="product-detail-spec-section"
            aria-labelledby="product-information-heading"
          >
            <div className="product-detail-spec-header">
              <h2
                id="product-information-heading"
                className="product-detail-spec-title"
              >
                Product information
              </h2>
              <p className="product-detail-spec-subtitle">
                Key specs curated from the manufacturer and marketplace data.
              </p>
            </div>
            {detailEntries.length ? (
              <dl className="product-detail-spec-grid">
                {detailEntries.map((entry) => (
                  <div
                    key={entry.label.toLowerCase()}
                    className="product-detail-spec-item"
                  >
                    <dt className="product-detail-spec-label">{entry.label}</dt>
                    <dd className="product-detail-spec-value">{entry.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="product-detail-spec-empty">
                Detailed product information will be available soon.
              </p>
            )}
          </section>
          <hr className="product-detail-section-divider" />
        </div>
      </main>
    </div>
  );
};

export default ProductDetails;
