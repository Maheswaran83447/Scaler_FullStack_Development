import React, { useContext, useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import { Link } from "react-router-dom";
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
const PRODUCT_PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80";

const Products = ({ user, onLogout }) => {
  const { addToCart } = useContext(CartContext);
  const { showToast } = useContext(ToastContext);
  const { isInWishlist, toggleWishlistItem } = useContext(WishlistContext);
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

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(24);
  const [total, setTotal] = useState(0);

  const fetchPage = (p = 1) => {
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/api/products?page=${p}&limit=${limit}`)
      .then((res) => res.json())
      .then((body) => {
        if (body && body.success) {
          setProducts(body.data || []);
          setTotal(body.meta?.total || 0);
          setPage(body.meta?.page || p);
        } else {
          setError("Failed to load products");
        }
      })
      .catch((err) => setError(err.message || "Failed to load products"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPage(1);
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <NavBar user={user} onLogout={onLogout} />
      <main style={{ padding: "2rem" }}>
        <h2>Products</h2>

        {loading && <p>Loading products…</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {!loading && !error && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1rem",
              }}
            >
              {products.map((p) => {
                const pid = p._id || p.id;
                const imageSrc =
                  (Array.isArray(p.images) && p.images[0]) ||
                  p.image ||
                  PRODUCT_PLACEHOLDER_IMAGE;
                return (
                  <div
                    key={pid}
                    className="product-card"
                    style={{
                      border: "1px solid #ddd",
                      padding: "1rem",
                      borderRadius: 6,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      position: "relative",
                    }}
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
                      onClick={() => handleToggleWishlist({ ...p, id: pid })}
                    >
                      {isInWishlist(pid) ? (
                        <FavoriteIcon fontSize="inherit" />
                      ) : (
                        <FavoriteBorderIcon fontSize="inherit" />
                      )}
                    </button>
                    <div>
                      <div
                        style={{
                          height: 140,
                          background: "#fafafa",
                          borderRadius: 6,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 12,
                          overflow: "hidden",
                        }}
                      >
                        <img
                          src={imageSrc}
                          alt={p.title || "Product image"}
                          loading="lazy"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                      <h3>{p.title}</h3>
                      <p>{p.description}</p>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 12,
                      }}
                    >
                      <strong>{formatINR(p.price)}</strong>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Link
                          to={`/products/${pid}`}
                          style={{ alignSelf: "center" }}
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleAddToCart({ ...p, id: pid })}
                          style={{ padding: "6px 10px", borderRadius: 6 }}
                        >
                          Add to cart
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                marginTop: 16,
                display: "flex",
                gap: 8,
                alignItems: "center",
              }}
            >
              <button
                onClick={() => fetchPage(Math.max(1, page - 1))}
                disabled={page <= 1}
              >
                Prev
              </button>
              <div>
                Page {page} of {totalPages} ({total} items)
              </div>
              <button
                onClick={() => fetchPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
              >
                Next
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Products;
