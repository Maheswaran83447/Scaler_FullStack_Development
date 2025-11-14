import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import NavBar from "../components/NavBar";
import { CartContext } from "../context/CartContext";
import { ToastContext } from "../context/ToastContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";
const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    n
  );

const ProductDetails = ({ user, onLogout }) => {
  const { id } = useParams();
  const { addToCart } = useContext(CartContext);
  const { showToast } = useContext(ToastContext);
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
  const handleAddToCart = () => {
    addToCart({ ...product, id: pid });
    showToast("Item added to cart successfully", { type: "success" });
  };

  return (
    <div>
      <NavBar user={user} onLogout={onLogout} />
      <main style={{ padding: "2rem" }}>
        <h2>{product.title}</h2>
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
