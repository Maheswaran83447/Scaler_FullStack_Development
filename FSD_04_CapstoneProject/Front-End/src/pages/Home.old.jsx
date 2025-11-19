import React, { useState, useEffect, useContext, useMemo } from "react";
import NavBar from "../components/NavBar";
import { CartContext } from "../context/CartContext";
import { ToastContext } from "../context/ToastContext";
import { WishlistContext } from "../context/WishlistContext";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { Link } from "react-router-dom";

        {/* Featured + categories */}
        <section style={{ marginTop: 24 }}>
          <h2>Featured products</h2>

          {loading && <p>Loading featured products…</p>}
          {error && <p style={{ color: "red" }}>{error}</p>}

          {!loading && !error && (
            <>
              <div className="home-grid">
                {products.slice(0, 9).map((p) => {
                  const pid = p._id || p.id;
                  return (
                    <Link
                      key={pid}
                      to={`/products/${pid}`}
                      className="product-card home-card-link"
                    >
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
                        onClick={(event) => {
                          event.preventDefault();
                          handleToggleWishlist({ ...p, id: pid });
                        }}
                      >
                        {isInWishlist(pid) ? (
                          <FavoriteIcon fontSize="inherit" />
                        ) : (
                          <FavoriteBorderIcon fontSize="inherit" />
                        )}
                      </button>
                      <div className="product-card-image" aria-hidden>
                        <span>{p.title?.[0]?.toUpperCase() || "P"}</span>
                      import React, { useState, useEffect, useContext, useMemo } from "react";
                      import { Link } from "react-router-dom";
                      import NavBar from "../components/NavBar";
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

                      const slides = [
                        {
                          id: "s1",
                          title: "Welcome to MyStore",
                          subtitle: "Quality products, great prices",
                          color: "#f6d365",
                        },
                        {
                          id: "s2",
                          title: "Seasonal Sale",
                          subtitle: "Up to 50% off select items",
                          color: "#a6c1ee",
                        },
                        {
                          id: "s3",
                          title: "New Arrivals",
                          subtitle: "Check out the latest",
                          color: "#fbc2eb",
                        },
                      ];

                      const Home = ({ user, onLogout }) => {
                        const [index, setIndex] = useState(0);
                        const { addToCart } = useContext(CartContext);
                        const { showToast } = useContext(ToastContext);
                        const { isInWishlist, toggleWishlistItem } = useContext(WishlistContext);
                        const [products, setProducts] = useState([]);
                        const [loading, setLoading] = useState(true);
                        const [error, setError] = useState(null);

                        const handleAddToCart = (item) => {
                          addToCart(item);
                          showToast("Item added to cart successfully", { type: "success" });
                        };

                        const handleToggleWishlist = (item) => {
                          const added = toggleWishlistItem(item);
                          showToast(added ? "Item added to wishlist" : "Item removed from wishlist", {
                            type: added ? "success" : "error",
                          });
                        };

                        useEffect(() => {
                          const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 4000);
                          return () => clearInterval(t);
                        }, []);

                        useEffect(() => {
                          let mounted = true;
                          setLoading(true);
                          fetch(`${API_BASE}/api/products`)
                            .then((res) => res.json())
                            .then((body) => {
                              if (!mounted) return;
                              if (body && body.success) setProducts(body.data || []);
                              else setError("Failed to load products");
                            })
                            .catch((err) => mounted && setError(err.message || "Failed to load"))
                            .finally(() => mounted && setLoading(false));
                          return () => {
                            mounted = false;
                          };
                        }, []);

                        const previewProducts = useMemo(() => products.slice(0, 10), [products]);
                        const featuredProducts = useMemo(() => products.slice(0, 9), [products]);

                        const categorized = useMemo(() => {
                          return products.reduce((acc, p) => {
                            const cat = p.category || "Uncategorized";
                            if (!acc[cat]) acc[cat] = [];
                            acc[cat].push(p);
                            return acc;
                          }, {});
                        }, [products]);

                        return (
                          <div>
                            <NavBar user={user} onLogout={onLogout} />

                            <main style={{ padding: "0 2rem 2rem 2rem" }}>
                              <section style={{ marginTop: 12 }}>
                                <div
                                  style={{
                                    position: "relative",
                                    height: 220,
                                    borderRadius: 8,
                                    overflow: "hidden",
                                  }}
                                >
                                  {slides.map((s, i) => (
                                    <div
                                      key={s.id}
                                      style={{
                                        position: "absolute",
                                        top: 0,
                                        left: `${(i - index) * 100}%`,
                                        width: "100%",
                                        height: "100%",
                                        background: s.color,
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        transition: "left 400ms ease",
                                      }}
                                    >
                                      <h2 style={{ margin: 0 }}>{s.title}</h2>
                                      <div style={{ opacity: 0.9 }}>{s.subtitle}</div>
                                    </div>
                                  ))}

                                  <button
                                    aria-label="previous"
                                    onClick={() =>
                                      setIndex((i) => (i - 1 + slides.length) % slides.length)
                                    }
                                    style={{
                                      position: "absolute",
                                      left: 8,
                                      top: "50%",
                                      transform: "translateY(-50%)",
                                    }}
                                  >
                                    ‹
                                  </button>
                                  <button
                                    aria-label="next"
                                    onClick={() => setIndex((i) => (i + 1) % slides.length)}
                                    style={{
                                      position: "absolute",
                                      right: 8,
                                      top: "50%",
                                      transform: "translateY(-50%)",
                                    }}
                                  >
                                    ›
                                  </button>
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    gap: 8,
                                    marginTop: 8,
                                  }}
                                >
                                  {slides.map((_, i) => (
                                    <button
                                      key={i}
                                      onClick={() => setIndex(i)}
                                      style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: 10,
                                        background: i === index ? "#333" : "#ddd",
                                        border: "none",
                                      }}
                                      aria-label={`go to slide ${i + 1}`}
                                    />
                                  ))}
                                </div>
                              </section>

                              {!loading && !error && previewProducts.length > 0 && (
                                <section className="home-preview">
                                  <div className="home-preview-title">Trending now</div>
                                  <div className="home-preview-strip">
                                    {previewProducts.map((p) => {
                                      const pid = p._id || p.id;
                                      return (
                                        <Link
                                          key={pid}
                                          to={`/products/${pid}`}
                                          className="home-preview-card"
                                          aria-label={`View ${p.title}`}
                                        >
                                          <div className="home-preview-image" aria-hidden>
                                            <span>{p.title?.[0]?.toUpperCase() || "P"}</span>
                                          </div>
                                        </Link>
                                      );
                                    })}
                                  </div>
                                </section>
                              )}

                              <section style={{ marginTop: 24 }}>
                                <h2>Featured products</h2>

                                {loading && <p>Loading featured products…</p>}
                                {error && <p style={{ color: "red" }}>{error}</p>}

                                {!loading && !error && (
                                  <>
                                    <div className="home-grid">
                                      {featuredProducts.map((p) => {
                                        const pid = p._id || p.id;
                                        return (
                                          <Link
                                            key={pid}
                                            to={`/products/${pid}`}
                                            className="product-card home-card-link"
                                          >
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
                                              onClick={(event) => {
                                                event.preventDefault();
                                                handleToggleWishlist({ ...p, id: pid });
                                              }}
                                            >
                                              {isInWishlist(pid) ? (
                                                <FavoriteIcon fontSize="inherit" />
                                              ) : (
                                                <FavoriteBorderIcon fontSize="inherit" />
                                              )}
                                            </button>
                                            <div className="product-card-image" aria-hidden>
                                              <span>{p.title?.[0]?.toUpperCase() || "P"}</span>
                                            </div>
                                            <h3 className="product-card-title">{p.title}</h3>
                                            <div className="product-card-footer">
                                              <strong>{formatINR(p.price)}</strong>
                                              <button
                                                type="button"
                                                onClick={(event) => {
                                                  event.preventDefault();
                                                  handleAddToCart({ ...p, id: pid });
                                                }}
                                              >
                                                Add to cart
                                              </button>
                                            </div>
                                          </Link>
                                        );
                                      })}
                                    </div>
                                    <div className="home-section-footer">
                                      <Link to="/products" className="home-more-link">
                                        See more deals
                                      </Link>
                                    </div>
                                  </>
                                )}

                                {!loading && !error && Object.keys(categorized).length > 0 && (
                                  <div className="home-category-list">
                                    {Object.keys(categorized).map((cat) => (
                                      <section key={cat} className="home-category">
                                        <div className="home-category-header">
                                          <h3>{cat}</h3>
                                          <Link to="/products" className="home-more-link">
                                            See more deals
                                          </Link>
                                        </div>
                                        <div className="home-grid">
                                          {categorized[cat].slice(0, 9).map((p) => {
                                            const pid = p._id || p.id;
                                            return (
                                              <Link
                                                key={pid}
                                                to={`/products/${pid}`}
                                                className="product-card home-card-link"
                                              >
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
                                                  onClick={(event) => {
                                                    event.preventDefault();
                                                    handleToggleWishlist({ ...p, id: pid });
                                                  }}
                                                >
                                                  {isInWishlist(pid) ? (
                                                    <FavoriteIcon fontSize="inherit" />
                                                  ) : (
                                                    <FavoriteBorderIcon fontSize="inherit" />
                                                  )}
                                                </button>
                                                <div className="product-card-image" aria-hidden>
                                                  <span>{p.title?.[0]?.toUpperCase() || "P"}</span>
                                                </div>
                                                <h4 className="product-card-title">{p.title}</h4>
                                                <div className="product-card-footer">
                                                  <strong>{formatINR(p.price)}</strong>
                                                  <button
                                                    type="button"
                                                    onClick={(event) => {
                                                      event.preventDefault();
                                                      handleAddToCart({ ...p, id: pid });
                                                    }}
                                                  >
                                                    Add to cart
                                                  </button>
                                                </div>
                                              </Link>
                                            );
                                          })}
                                        </div>
                                      </section>
                                    ))}
                                  </div>
                                )}
                              </section>
                            </main>
                          </div>
                        );
                      };

                      export default Home;
