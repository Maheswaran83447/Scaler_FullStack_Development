import React, { useState, useEffect, useContext } from "react";
import NavBar from "../components/NavBar";
import { CartContext } from "../context/CartContext";
import { ToastContext } from "../context/ToastContext";

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
  const [products, setProducts] = useState([]);
  const handleAddToCart = (item) => {
    addToCart(item);
    showToast("Item added to cart successfully", { type: "success" });
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    return () => (mounted = false);
  }, []);

  return (
    <div>
      <NavBar user={user} onLogout={onLogout} />

      <main style={{ padding: "0 2rem 2rem 2rem" }}>
        {/* Carousel */}
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

            {/* controls */}
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

        {/* Featured + categories */}
        <section style={{ marginTop: 24 }}>
          <h2>Featured products</h2>

          {loading && <p>Loading featured products…</p>}
          {error && <p style={{ color: "red" }}>{error}</p>}

          {!loading && !error && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))",
                gap: 16,
                marginTop: 12,
              }}
            >
              {products.slice(0, 12).map((p) => {
                const pid = p._id || p.id;
                return (
                  <div
                    key={pid}
                    style={{
                      border: "1px solid #e6e6e6",
                      borderRadius: 8,
                      padding: 12,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          height: 110,
                          background: "#fafafa",
                          borderRadius: 6,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 8,
                        }}
                      >
                        <span style={{ color: "#999" }}>Image</span>
                      </div>
                      <h3 style={{ margin: "6px 0" }}>{p.title}</h3>
                      <p style={{ color: "#555", fontSize: 14 }}>
                        {p.description}
                      </p>
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
                      <button
                        onClick={() => handleAddToCart({ ...p, id: pid })}
                        style={{ padding: "8px 12px", borderRadius: 6 }}
                      >
                        Add to cart
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* categories */}
          {!loading && !error && (
            <div style={{ marginTop: 28 }}>
              {(() => {
                const byCat = products.reduce((acc, p) => {
                  const cat = p.category || "Uncategorized";
                  acc[cat] = acc[cat] || [];
                  acc[cat].push(p);
                  return acc;
                }, {});

                return Object.keys(byCat).map((cat) => (
                  <section key={cat} style={{ marginTop: 20 }}>
                    <h3 style={{ marginBottom: 8 }}>{cat}</h3>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(220px,1fr))",
                        gap: 12,
                      }}
                    >
                      {byCat[cat].slice(0, 12).map((p) => {
                        const pid = p._id || p.id;
                        return (
                          <div
                            key={pid}
                            style={{
                              border: "1px solid #e6e6e6",
                              borderRadius: 8,
                              padding: 12,
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  height: 110,
                                  background: "#fafafa",
                                  borderRadius: 6,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  marginBottom: 8,
                                }}
                              >
                                <span style={{ color: "#999" }}>Image</span>
                              </div>
                              <h4 style={{ margin: "6px 0" }}>{p.title}</h4>
                              <p style={{ color: "#555", fontSize: 13 }}>
                                {p.description}
                              </p>
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
                              <button
                                onClick={() =>
                                  handleAddToCart({ ...p, id: pid })
                                }
                                style={{ padding: "8px 12px", borderRadius: 6 }}
                              >
                                Add to cart
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ));
              })()}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Home;
