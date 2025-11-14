import React, { useContext } from "react";
import NavBar from "../components/NavBar";
import { CartContext } from "../context/CartContext";
import { useNavigate } from "react-router-dom";

const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    Number(n)
  );

const Cart = ({ user, onLogout }) => {
  const { cart, removeFromCart, updateQuantity, clearCart } =
    useContext(CartContext);

  const total = cart.reduce((s, it) => s + it.price * (it.quantity || 1), 0);

  const navigate = useNavigate();

  return (
    <div>
      <NavBar user={user} onLogout={onLogout} />
      <main style={{ padding: "2rem" }}>
        <h2>Your Cart</h2>
        {cart.length === 0 ? (
          <p>Your cart is empty. Browse products to add items.</p>
        ) : (
          <div>
            <div style={{ display: "grid", gap: 12 }}>
              {cart.map((item) => (
                <div
                  key={item.id}
                  style={{
                    border: "1px solid #ddd",
                    padding: 12,
                    borderRadius: 6,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>{item.title}</div>
                    <div>{formatINR(item.price)} each</div>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(item.id, Number(e.target.value))
                      }
                      style={{ width: 60 }}
                    />
                    <div>{formatINR(item.price * item.quantity)}</div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      style={{ padding: "6px 10px" }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, fontWeight: 700 }}>
              Total: {formatINR(total)}
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              <button onClick={clearCart} style={{ padding: "8px 12px" }}>
                Clear cart
              </button>
              <button
                onClick={() => navigate("/checkout")}
                style={{
                  padding: "8px 12px",
                  background: "#1976d2",
                  color: "#fff",
                  borderRadius: 6,
                }}
              >
                Proceed to buy
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Cart;
