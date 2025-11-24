import React, { useContext, useEffect, useMemo, useState } from "react";
import NavBar from "../components/NavBar";
import { Link, useLocation } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { ToastContext } from "../context/ToastContext";
import { WishlistContext } from "../context/WishlistContext";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";
const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    n
  );
const formatCount = (value) =>
  new Intl.NumberFormat("en-IN", { notation: "compact" }).format(
    Math.max(0, value || 0)
  );
const PRODUCT_PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80";

const PRICE_BUCKETS = [
  { label: "Under ₹1,000", value: "under-1000", range: [0, 1000] },
  { label: "₹1,000 - ₹5,000", value: "1000-5000", range: [1000, 5000] },
  { label: "₹5,000 - ₹10,000", value: "5000-10000", range: [5000, 10000] },
  { label: "₹10,000 & above", value: "above-10000", range: [10000, Infinity] },
];

const DISCOUNT_OPTIONS = [
  { label: "10% off or more", value: 10 },
  { label: "20% off or more", value: 20 },
  { label: "30% off or more", value: 30 },
  { label: "40% off or more", value: 40 },
  { label: "50% off or more", value: 50 },
];

const RATING_OPTIONS = [
  { label: "4★ & above", value: 4 },
  { label: "3★ & above", value: 3 },
  { label: "2★ & above", value: 2 },
  { label: "1★ & above", value: 1 },
];

const PAGE_SIZE = 10;

const resolveBrand = (product) =>
  product.brand || product.brandName || product.manufacturer || "Cartify";

const calculateDiscountPercent = (product) => {
  const price = Number(product.price);
  const discountPrice = Number(product.discountPrice);
  if (
    !price ||
    !discountPrice ||
    Number.isNaN(price) ||
    Number.isNaN(discountPrice)
  ) {
    return 0;
  }
  if (discountPrice >= price) return 0;
  return Math.round(((price - discountPrice) / price) * 100);
};

const resolveAverageRating = (product) => {
  if (typeof product.averageRating === "number") {
    return product.averageRating;
  }
  if (typeof product.rating === "number") {
    return product.rating;
  }
  const summaryAverage = product.reviewSummary?.averageRating;
  if (typeof summaryAverage === "number") return summaryAverage;
  return 0;
};

const resolveReviewCount = (product) => {
  if (typeof product.reviewCount === "number") return product.reviewCount;
  if (typeof product.ratingsCount === "number") return product.ratingsCount;
  if (typeof product.reviewTotal === "number") return product.reviewTotal;
  return 0;
};

const Products = ({ user, onLogout }) => {
  const { addToCart } = useContext(CartContext);
  const { showToast } = useContext(ToastContext);
  const { isInWishlist, toggleWishlistItem } = useContext(WishlistContext);
  const location = useLocation();

  const handleAddToCart = (item) => {
    addToCart(item);
    showToast("Item added to cart successfully", { type: "success" });
  };

  const handleWishlistToggle = (item) => {
    const added = toggleWishlistItem(item);
    showToast(added ? "Item added to wishlist" : "Item removed from wishlist", {
      type: added ? "success" : "error",
    });
  };

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [priceBounds, setPriceBounds] = useState({ min: 0, max: 0 });
  const [priceRange, setPriceRange] = useState([0, 0]);
  const [selectedPriceBucket, setSelectedPriceBucket] = useState(null);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedRating, setSelectedRating] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const categoryParam = searchParams.get("category");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("limit", "200");
    if (categoryParam) {
      params.set("category", categoryParam);
    }

    fetch(`${API_BASE}/api/products?${params.toString()}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((body) => {
        if (body && body.success) {
          const items = Array.isArray(body.data) ? body.data : [];
          setProducts(items);

          if (items.length) {
            const prices = items
              .map((product) => Number(product.discountPrice || product.price))
              .filter((value) => Number.isFinite(value) && value > 0);

            if (prices.length) {
              const minPrice = Math.floor(Math.min(...prices));
              const maxPrice = Math.ceil(Math.max(...prices));
              const boundedMin = Math.max(0, minPrice);
              setPriceBounds({ min: boundedMin, max: maxPrice });
              setPriceRange([boundedMin, maxPrice]);
            } else {
              setPriceBounds({ min: 0, max: 0 });
              setPriceRange([0, 0]);
            }
          } else {
            setPriceBounds({ min: 0, max: 0 });
            setPriceRange([0, 0]);
          }

          setSelectedPriceBucket(null);
          setSelectedDiscount(null);
          setSelectedBrands([]);
          setSelectedRating(null);
          setCurrentPage(1);
        } else {
          throw new Error(body?.message || "Failed to load products");
        }
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        setError(error.message || "Failed to load products");
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [categoryParam]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    priceRange,
    selectedPriceBucket,
    selectedDiscount,
    selectedBrands,
    selectedRating,
  ]);

  const brandOptions = useMemo(() => {
    const unique = new Set(
      products
        .map((product) => resolveBrand(product))
        .filter((brand) => typeof brand === "string" && brand.trim().length)
    );
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const baseItems = categoryParam
      ? products.filter(
          (product) =>
            (product.category || "").toLowerCase() ===
            categoryParam.toLowerCase()
        )
      : products.slice();

    return baseItems.filter((product) => {
      const effectivePrice =
        Number(product.discountPrice || product.price) || 0;

      if (
        priceBounds.max > priceBounds.min &&
        (effectivePrice < priceRange[0] || effectivePrice > priceRange[1])
      ) {
        return false;
      }

      if (selectedPriceBucket) {
        const bucket = PRICE_BUCKETS.find(
          (item) => item.value === selectedPriceBucket
        );
        if (bucket) {
          const [bucketMin, bucketMaxRaw] = bucket.range;
          const bucketMax =
            bucketMaxRaw === Infinity ? Number.MAX_SAFE_INTEGER : bucketMaxRaw;
          if (effectivePrice < bucketMin || effectivePrice > bucketMax) {
            return false;
          }
        }
      }

      if (selectedDiscount) {
        const discountPercent = calculateDiscountPercent(product);
        if (discountPercent < selectedDiscount) {
          return false;
        }
      }

      if (selectedBrands.length) {
        const brand = resolveBrand(product);
        if (!selectedBrands.includes(brand)) {
          return false;
        }
      }

      if (selectedRating) {
        const rating = Number(resolveAverageRating(product)) || 0;
        if (rating < selectedRating) {
          return false;
        }
      }

      return true;
    });
  }, [
    products,
    categoryParam,
    priceBounds.max,
    priceBounds.min,
    priceRange,
    selectedPriceBucket,
    selectedDiscount,
    selectedBrands,
    selectedRating,
  ]);

  const totalResults = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const rawCategory = categoryParam ? decodeURIComponent(categoryParam) : null;
  const currentCategoryLabel = rawCategory
    ? rawCategory === "Veg & Fruits"
      ? "Cartify Fresh"
      : rawCategory
    : "All Products";

  const sliderDisabled = priceBounds.max <= priceBounds.min;

  const handlePriceSliderChange = (index, value) => {
    const numericValue = Number(value);
    setSelectedPriceBucket(null);
    setPriceRange((prev) => {
      const next = [...prev];
      next[index] = numericValue;
      if (index === 0 && numericValue > next[1]) {
        next[1] = numericValue;
      }
      if (index === 1 && numericValue < next[0]) {
        next[0] = numericValue;
      }
      return next;
    });
  };

  const handleBucketSelect = (value) => {
    if (selectedPriceBucket === value) {
      setSelectedPriceBucket(null);
      setPriceRange([priceBounds.min, priceBounds.max]);
      return;
    }
    const bucket = PRICE_BUCKETS.find((item) => item.value === value);
    if (bucket) {
      const [bucketMin, bucketMaxRaw] = bucket.range;
      const bucketMax =
        bucketMaxRaw === Infinity ? priceBounds.max : bucketMaxRaw;
      setSelectedPriceBucket(value);
      setPriceRange([
        Math.max(priceBounds.min, bucketMin),
        Math.min(priceBounds.max, bucketMax),
      ]);
    }
  };

  const handleBrandToggle = (brand) => {
    setSelectedBrands((prev) =>
      prev.includes(brand)
        ? prev.filter((item) => item !== brand)
        : [...prev, brand]
    );
  };

  const handleClearFilters = () => {
    setSelectedPriceBucket(null);
    setSelectedDiscount(null);
    setSelectedBrands([]);
    setSelectedRating(null);
    setPriceRange([priceBounds.min, priceBounds.max]);
  };

  const renderProductCard = (product) => {
    const pid = product._id || product.id;
    const imageSrc =
      (Array.isArray(product.images) && product.images[0]) ||
      product.image ||
      PRODUCT_PLACEHOLDER_IMAGE;
    const brand = resolveBrand(product);
    const rating = Number(resolveAverageRating(product)) || 0;
    const reviewTotal = resolveReviewCount(product);
    const discountPercent = calculateDiscountPercent(product);
    const displayPrice = Number(product.discountPrice) || Number(product.price);

    return (
      <article key={pid} className="products-result-card">
        <Link
          to={`/products/${pid}`}
          className="products-result-media"
          aria-label={`View details for ${product.title || "product"}`}
        >
          <img
            src={imageSrc}
            alt={product.title || "Product image"}
            loading="lazy"
          />
        </Link>
        <div className="products-result-content">
          <div className="products-result-header">
            <Link to={`/products/${pid}`} className="products-result-title">
              {product.title}
            </Link>
            <span className="products-result-brand">{brand}</span>
            <div className="products-result-meta">
              <span
                className="products-result-rating"
                aria-label={`Rated ${rating.toFixed(1)} out of 5`}
              >
                ⭐ {rating.toFixed(1)}
                {reviewTotal > 0 && (
                  <span className="products-result-rating-count">
                    ({formatCount(reviewTotal)})
                  </span>
                )}
              </span>
              {discountPercent > 0 && (
                <span className="products-result-badge">
                  Save {discountPercent}%
                </span>
              )}
            </div>
          </div>
          <p className="products-result-description">
            {product.description ||
              "Premium Cartify selection crafted for everyday convenience."}
          </p>
          <div className="products-result-footer">
            <div className="products-result-pricing">
              <span className="products-result-price">
                {formatINR(displayPrice)}
              </span>
              {product.discountPrice &&
                product.discountPrice < product.price && (
                  <span className="products-result-original">
                    {formatINR(product.price)}
                  </span>
                )}
            </div>
            <div className="products-result-actions">
              <button
                type="button"
                className={`wishlist-toggle ${
                  isInWishlist(pid) ? "active" : ""
                }`}
                aria-label={
                  isInWishlist(pid) ? "Remove from wishlist" : "Add to wishlist"
                }
                aria-pressed={isInWishlist(pid)}
                onClick={() => handleWishlistToggle({ ...product, id: pid })}
              >
                {isInWishlist(pid) ? (
                  <FavoriteIcon fontSize="inherit" />
                ) : (
                  <FavoriteBorderIcon fontSize="inherit" />
                )}
              </button>
              <button
                type="button"
                className="products-result-cart"
                onClick={() => handleAddToCart({ ...product, id: pid })}
              >
                Add to cart
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div>
      <NavBar user={user} onLogout={onLogout} />
      <main className="products-page">
        <header className="products-page-header">
          <div>
            <h2>{currentCategoryLabel}</h2>
            {!loading && !error && (
              <p className="products-page-subtitle">
                Showing {paginatedProducts.length} of {totalResults} products
              </p>
            )}
          </div>
          <button
            type="button"
            className="products-clear-filters"
            onClick={handleClearFilters}
            disabled={
              loading ||
              (!selectedPriceBucket &&
                !selectedDiscount &&
                !selectedBrands.length &&
                !selectedRating &&
                priceRange[0] === priceBounds.min &&
                priceRange[1] === priceBounds.max)
            }
          >
            Clear filters
          </button>
        </header>

        {loading && <p>Loading products…</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {!loading && !error && (
          <div className="products-layout">
            <aside className="products-filters" aria-label="Filters">
              <section className="products-filter-block">
                <h3>Price range</h3>
                <div className="products-slider-group">
                  <label>
                    Min ₹
                    <input
                      type="range"
                      min={priceBounds.min}
                      max={priceBounds.max}
                      value={priceRange[0]}
                      onChange={(event) =>
                        handlePriceSliderChange(0, event.target.value)
                      }
                      disabled={sliderDisabled}
                    />
                    <span>{formatINR(priceRange[0])}</span>
                  </label>
                  <label>
                    Max ₹
                    <input
                      type="range"
                      min={priceBounds.min}
                      max={priceBounds.max}
                      value={priceRange[1]}
                      onChange={(event) =>
                        handlePriceSliderChange(1, event.target.value)
                      }
                      disabled={sliderDisabled}
                    />
                    <span>{formatINR(priceRange[1])}</span>
                  </label>
                </div>
              </section>

              <section className="products-filter-block">
                <h3>Price buckets</h3>
                <div className="products-checkbox-group">
                  {PRICE_BUCKETS.map((bucket) => (
                    <label key={bucket.value}>
                      <input
                        type="checkbox"
                        checked={selectedPriceBucket === bucket.value}
                        onChange={() => handleBucketSelect(bucket.value)}
                      />
                      {bucket.label}
                    </label>
                  ))}
                </div>
              </section>

              <section className="products-filter-block">
                <h3>Discounts</h3>
                <div className="products-checkbox-group">
                  {DISCOUNT_OPTIONS.map((option) => (
                    <label key={option.value}>
                      <input
                        type="radio"
                        name="discount-filter"
                        checked={selectedDiscount === option.value}
                        onChange={() =>
                          setSelectedDiscount((prev) =>
                            prev === option.value ? null : option.value
                          )
                        }
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </section>

              <section className="products-filter-block">
                <h3>Brands</h3>
                <div className="products-checkbox-group">
                  {brandOptions.length ? (
                    brandOptions.map((brand) => (
                      <label key={brand}>
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand)}
                          onChange={() => handleBrandToggle(brand)}
                        />
                        {brand}
                      </label>
                    ))
                  ) : (
                    <p className="products-filter-empty">Brands coming soon.</p>
                  )}
                </div>
              </section>

              <section className="products-filter-block">
                <h3>Reviews</h3>
                <div className="products-checkbox-group">
                  {RATING_OPTIONS.map((option) => (
                    <label key={option.value}>
                      <input
                        type="radio"
                        name="rating-filter"
                        checked={selectedRating === option.value}
                        onChange={() =>
                          setSelectedRating((prev) =>
                            prev === option.value ? null : option.value
                          )
                        }
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </section>
            </aside>

            <section className="products-results" aria-live="polite">
              {paginatedProducts.length === 0 ? (
                <p>No products found. Try adjusting the filters.</p>
              ) : (
                paginatedProducts.map((product) => renderProductCard(product))
              )}

              {totalPages > 1 && (
                <nav
                  className="products-pagination"
                  aria-label="Products pagination"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage <= 1}
                  >
                    Previous
                  </button>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage >= totalPages}
                  >
                    Next
                  </button>
                </nav>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default Products;
