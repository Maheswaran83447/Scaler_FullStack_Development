import React, { useContext, useState } from "react";
import NavBar from "../components/NavBar";
import { CartContext } from "../context/CartContext";
import { useNavigate } from "react-router-dom";

const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    Number(value)
  );

const mockAddresses = [
  { id: "a1", label: "Home", line: "221B Baker Street, London" },
  { id: "a2", label: "Work", line: "12 Commerce St, Business Park" },
];

const PlaceOrder = ({ user, onLogout }) => {
  const { cart, clearCart } = useContext(CartContext);
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState(mockAddresses);
  const [selectedAddress, setSelectedAddress] = useState(
    addresses[0]?.id || null
  );
  const [showAdd, setShowAdd] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: "",
    line: "",
    type: "home",
  });

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [card, setCard] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });

  const total = cart.reduce((s, it) => s + it.price * (it.quantity || 1), 0);

  function addAddress() {
    const id = `a${Date.now()}`;
    const addr = {
      id,
      label: newAddress.label || "Other",
      line: newAddress.line,
    };
    setAddresses((prev) => [...prev, addr]);
    setSelectedAddress(id);
    setNewAddress({ label: "", line: "", type: "home" });
    setShowAdd(false);
  }

  function handlePay() {
    // simulate payment processing
    alert(
      `Order placed. Payment method: ${paymentMethod}. Total: ${formatINR(
        total
      )}`
    );
    clearCart();
    navigate("/home");
  }

  return (
    <div>
      <NavBar user={user} onLogout={onLogout} />
      <main style={{ padding: "1.5rem" }}>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 18 }}
        >
          {/* LEFT: Order summary */}
          <section
            style={{
              background: "#fff",
              border: "1px solid #eee",
              padding: 16,
              borderRadius: 8,
            }}
          >
            <h3>Order summary</h3>
            {cart.length === 0 ? (
              <p>Your cart is empty.</p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {cart.map((it) => (
                  <div
                    key={it.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid #f0f0f0",
                      paddingBottom: 8,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>{it.title}</div>
                      <div style={{ fontSize: 13, color: "#666" }}>
                        Qty: {it.quantity}
                      </div>
                    </div>
                    <div>{formatINR(it.price * it.quantity)}</div>
                  </div>
                ))}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: 700,
                    marginTop: 8,
                  }}
                >
                  <div>Subtotal</div>
                  <div>{formatINR(total)}</div>
                </div>
              </div>
            )}
            <div style={{ marginTop: 16 }}>
              <button
                onClick={() => navigate("/cart")}
                style={{ padding: "8px 12px" }}
              >
                Back to cart
              </button>
            </div>
          </section>

          {/* RIGHT: Delivery & Payment */}
          <aside
            style={{
              background: "#fff",
              border: "1px solid #eee",
              padding: 16,
              borderRadius: 8,
            }}
          >
            <h4>Delivery address</h4>
            <div style={{ display: "grid", gap: 8 }}>
              {addresses.map((a) => (
                <label
                  key={a.id}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <input
                    type="radio"
                    name="address"
                    checked={selectedAddress === a.id}
                    onChange={() => setSelectedAddress(a.id)}
                  />
                  <div>
                    <div style={{ fontWeight: 700 }}>{a.label}</div>
                    <div style={{ fontSize: 13, color: "#555" }}>{a.line}</div>
                  </div>
                </label>
              ))}

              <div>
                <button
                  onClick={() => setShowAdd((s) => !s)}
                  style={{ padding: "6px 10px" }}
                >
                  {showAdd ? "Cancel" : "Add new address"}
                </button>
              </div>

              {showAdd && (
                <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                  <input
                    placeholder="Label (Home / Work)"
                    value={newAddress.label}
                    onChange={(e) =>
                      setNewAddress((n) => ({ ...n, label: e.target.value }))
                    }
                  />
                  <input
                    placeholder="Address line"
                    value={newAddress.line}
                    onChange={(e) =>
                      setNewAddress((n) => ({ ...n, line: e.target.value }))
                    }
                  />
                  <div>
                    <label style={{ marginRight: 8 }}>
                      <input
                        type="radio"
                        name="type"
                        checked={newAddress.type === "home"}
                        onChange={() =>
                          setNewAddress((n) => ({ ...n, type: "home" }))
                        }
                      />{" "}
                      Home
                    </label>
                    <label style={{ marginRight: 8 }}>
                      <input
                        type="radio"
                        name="type"
                        checked={newAddress.type === "work"}
                        onChange={() =>
                          setNewAddress((n) => ({ ...n, type: "work" }))
                        }
                      />{" "}
                      Work
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="type"
                        checked={newAddress.type === "other"}
                        onChange={() =>
                          setNewAddress((n) => ({ ...n, type: "other" }))
                        }
                      />{" "}
                      Other
                    </label>
                  </div>
                  <div>
                    <button
                      onClick={addAddress}
                      style={{ padding: "8px 12px" }}
                    >
                      Save address
                    </button>
                  </div>
                </div>
              )}
            </div>

            <hr style={{ margin: "12px 0" }} />

            <h4>Payment</h4>
            <div style={{ display: "grid", gap: 8 }}>
              <label>
                <input
                  type="radio"
                  name="pay"
                  checked={paymentMethod === "card"}
                  onChange={() => setPaymentMethod("card")}
                />{" "}
                Debit/Credit card
              </label>
              <label>
                <input
                  type="radio"
                  name="pay"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                />{" "}
                Cash on delivery
              </label>
              <label>
                <input
                  type="radio"
                  name="pay"
                  checked={paymentMethod === "upi"}
                  onChange={() => setPaymentMethod("upi")}
                />{" "}
                UPI
              </label>

              {paymentMethod === "card" && (
                <div style={{ display: "grid", gap: 8 }}>
                  <input
                    placeholder="Card number"
                    value={card.number}
                    onChange={(e) =>
                      setCard((c) => ({ ...c, number: e.target.value }))
                    }
                  />
                  <input
                    placeholder="Name on card"
                    value={card.name}
                    onChange={(e) =>
                      setCard((c) => ({ ...c, name: e.target.value }))
                    }
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      placeholder="MM/YY"
                      value={card.expiry}
                      onChange={(e) =>
                        setCard((c) => ({ ...c, expiry: e.target.value }))
                      }
                    />
                    <input
                      placeholder="CVV"
                      value={card.cvv}
                      onChange={(e) =>
                        setCard((c) => ({ ...c, cvv: e.target.value }))
                      }
                    />
                  </div>
                </div>
              )}

              <div style={{ marginTop: 12 }}>
                <button
                  onClick={handlePay}
                  style={{
                    padding: "10px 14px",
                    background: "#222",
                    color: "#fff",
                    borderRadius: 6,
                  }}
                >
                  Pay {formatINR(total)}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default PlaceOrder;
