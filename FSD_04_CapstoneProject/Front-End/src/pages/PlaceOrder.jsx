import React, { useContext, useState } from "react";
import NavBar from "../components/NavBar";
import { CartContext } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { ToastContext } from "../context/ToastContext";
import orderService from "../services/orderService";
import paymentService from "../services/paymentService";

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
  const { showToast } = useContext(ToastContext);
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

  const [paymentMethod, setPaymentMethod] = useState("card");
  const [card, setCard] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

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

  async function submitOrder(orderPayloadOverrides = {}) {
    const response = await orderService.createOrder(orderPayloadOverrides);
    if (!response?.success) {
      throw new Error(response?.message || "Unable to place order");
    }

    showToast("Order placed successfully", { type: "success" });
    clearCart();
    navigate("/orders");
  }

  async function handlePay() {
    if (!cart.length) {
      showToast("Your cart is empty", { type: "info" });
      return;
    }

    if (total <= 0) {
      showToast("Order total must be greater than zero", { type: "warning" });
      return;
    }

    const address = addresses.find((a) => a.id === selectedAddress);
    if (!address) {
      showToast("Select a delivery address before paying", {
        type: "warning",
      });
      return;
    }

    const orderPayload = {
      items: cart.map((item) => ({
        productId: item.id || item._id || null,
        name: item.title || item.name || "Cartify item",
        price: item.price,
        quantity: item.quantity || 1,
      })),
      paymentMethod,
      shippingAddress: {
        label: address.label,
        line: address.line,
      },
      totalAmount: total,
    };

    setIsPlacingOrder(true);
    let shouldResetLoading = true;
    try {
      if (paymentMethod === "cod") {
        await submitOrder({ ...orderPayload, paymentStatus: "pending" });
        return;
      }

      if (typeof window === "undefined" || !window.Razorpay) {
        throw new Error(
          "Payment gateway unavailable. Please refresh and try again."
        );
      }

      shouldResetLoading = false;

      const paymentInit = await paymentService.createOrder({
        amount: total,
        currency: "INR",
        notes: {
          items: String(cart.length),
          subtotal: String(total),
        },
      });

      if (!paymentInit?.success) {
        throw new Error(
          paymentInit?.message || "Unable to initialise payment session"
        );
      }

      const options = {
        key: paymentInit.key,
        amount: paymentInit.amount,
        currency: paymentInit.currency,
        name: "Cartify",
        description: "Secure payment",
        order_id: paymentInit.orderId,
        prefill: {
          name: user?.name || "Cartify Shopper",
          email: user?.email || "shopper@example.com",
          contact: user?.phone || "",
        },
        notes: {
          shippingAddress: `${address.label}: ${address.line}`,
        },
        theme: {
          color: "#222222",
        },
        handler: async (paymentResponse) => {
          try {
            await paymentService.verifyPayment(paymentResponse);
            await submitOrder({
              ...orderPayload,
              paymentStatus: "paid",
              paymentDetails: {
                provider: "razorpay",
                razorpayOrderId: paymentResponse.razorpay_order_id,
                razorpayPaymentId: paymentResponse.razorpay_payment_id,
              },
            });
          } catch (error) {
            showToast(error.message || "Payment verification failed", {
              type: "error",
            });
          } finally {
            setIsPlacingOrder(false);
          }
        },
        modal: {
          ondismiss: () => {
            showToast("Payment flow cancelled", { type: "info" });
            setIsPlacingOrder(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        const description = response?.error?.description;
        showToast(description || "Payment failed", { type: "error" });
        setIsPlacingOrder(false);
      });

      rzp.open();
    } catch (error) {
      showToast(error.message || "Unable to place order", {
        type: "error",
      });
    } finally {
      if (shouldResetLoading) {
        setIsPlacingOrder(false);
      }
    }
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

              <div style={{ marginTop: 12 }}>
                <button
                  type="button"
                  onClick={handlePay}
                  style={{
                    padding: "10px 14px",
                    background: "#222",
                    color: "#fff",
                    borderRadius: 6,
                  }}
                  disabled={isPlacingOrder || cart.length === 0}
                >
                  {isPlacingOrder
                    ? "Placing order..."
                    : `Pay ${formatINR(total)}`}
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
