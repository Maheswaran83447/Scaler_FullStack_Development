import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
const PRODUCT_PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80";

const pickProductImage = (product, preference = "default") => {
  if (!product) {
    return PRODUCT_PLACEHOLDER_IMAGE;
  }

  const variants = product.imageVariants;
  if (variants && typeof variants === "object") {
    switch (preference) {
      case "small":
        return variants.small || variants.medium || variants.large;
      case "medium":
        return variants.medium || variants.large || variants.small;
      case "large":
        return variants.large || variants.medium || variants.small;
      default:
        return variants.large || variants.medium || variants.small;
    }
  }

  if (Array.isArray(product.images) && product.images[0]) {
    return product.images[0];
  }

  if (product.image) {
    return product.image;
  }

  return PRODUCT_PLACEHOLDER_IMAGE;
};

const ProductDetails = ({ user, onLogout }) => {
  const { id } = useParams();
  const { addToCart } = useContext(CartContext);
  const { showToast } = useContext(ToastContext);
  const { isInWishlist, toggleWishlistItem } = useContext(WishlistContext);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch(`${API_BASE}/api/products/${id}`)
      .then((res) => res.json())
      .then((body) => {
        if (!mounted) return;
        if (body && body.success) setProduct(body.data);
        else setError(body.message || "Product not found");
      })
      .catch((err) => mounted && setError(err.message || "Failed to load"))
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, [id]);

  if (loading) {
    return (
      <div>
        <NavBar user={user} onLogout={onLogout} />
        <main style={{ padding: "2rem" }}>
          <p>Loading…</p>
        </main>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div>
        <NavBar user={user} onLogout={onLogout} />
        <main style={{ padding: "2rem" }}>
          <p style={{ color: "red" }}>{error || "Product not found."}</p>
        </main>
      </div>
    );
  }

  const pid = product._id || product.id;
  const imageSrc = pickProductImage(product, "large");
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

  return (
    <div>
      <NavBar user={user} onLogout={onLogout} />
      <main style={{ padding: "2rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <h2 style={{ margin: 0 }}>{product.title}</h2>
          <button
            type="button"
            className={`wishlist-toggle ${isInWishlist(pid) ? "active" : ""}`}
            aria-label={
              isInWishlist(pid) ? "Remove from wishlist" : "Add to wishlist"
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
        <div
          style={{
            marginTop: 20,
            maxWidth: 420,
            width: "100%",
            background: "#fafafa",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <img
            src={imageSrc}
            alt={product.title || "Product image"}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
        <p>{product.description}</p>
        <p>
          <strong>{formatINR(product.price)}</strong>
        </p>
        <div style={{ marginTop: 12 }}>
          <button
            onClick={handleAddToCart}
            style={{ padding: "8px 12px", borderRadius: 6 }}
          >
            Add to cart
          </button>
        </div>
      </main>
    </div>
  );
};

export default ProductDetails;
