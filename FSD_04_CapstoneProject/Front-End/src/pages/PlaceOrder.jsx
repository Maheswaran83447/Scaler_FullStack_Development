import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import NavBar from "../components/NavBar";
import { CartContext } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { ToastContext } from "../context/ToastContext";
import orderService from "../services/orderService";
import paymentService from "../services/paymentService";
import addressService from "../services/addressService";

const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    Number(value)
  );

const INITIAL_ADDRESS_FORM = {
  label: "",
  addressLine1: "",
  addressLine2: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  tag: "home",
  isDefaultShipping: false,
  isDefaultBilling: false,
  isCurrentAddress: false,
};

const PRODUCT_PLACEHOLDER_IMAGE =
  "https://via.placeholder.com/96x96.png?text=Cartify";

const resolveAddressId = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  const raw = value._id || value.id || value.addressId;
  return raw ? String(raw) : null;
};

const resolveUserId = (value) => {
  if (!value || value.isGuest) return null;
  const raw = value._id || value.id || value.userId || value.user_id || null;
  if (raw == null) return null;
  const normalized = String(raw).trim();
  if (!normalized || normalized.toLowerCase() === "guest") {
    return null;
  }
  return normalized;
};

const resolveItemImage = (item) => {
  if (!item) return PRODUCT_PLACEHOLDER_IMAGE;
  const sources = [item.image, item.thumbnail, item.img, item.coverImage];
  if (Array.isArray(item.images)) {
    sources.push(item.images[0]);
  }
  const resolved = sources.find((src) => typeof src === "string" && src.trim());
  return resolved || PRODUCT_PLACEHOLDER_IMAGE;
};

const resolveCartItemId = (item) => {
  if (!item) return null;
  return item.id || item._id || item.productId || null;
};

const PlaceOrder = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const { cart, clearCart, updateQuantity, removeFromCart } =
    useContext(CartContext);
  const { showToast } = useContext(ToastContext);

  const totalQuantity = useMemo(
    () => cart.reduce((sum, item) => sum + (item.quantity || 0), 0),
    [cart]
  );

  const total = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 0),
        0
      ),
    [cart]
  );

  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressesError, setAddressesError] = useState("");
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newAddress, setNewAddress] = useState(INITIAL_ADDRESS_FORM);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const userId = resolveUserId(user);
  const isPayDisabled = isPlacingOrder || !cart.length || total <= 0;

  const handleToggleAdd = () => {
    setShowAdd((prev) => {
      const next = !prev;
      if (!next) {
        setNewAddress(INITIAL_ADDRESS_FORM);
      }
      return next;
    });
  };

  const handleNewAddressChange = (field, value) => {
    setNewAddress((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const loadAddresses = useCallback(
    async (focusAddressId = null) => {
      if (!userId) {
        setAddresses([]);
        setSelectedAddress(null);
        return;
      }

      setAddressesLoading(true);
      setAddressesError("");
      try {
        const response = await addressService.list(userId);
        if (!response?.success) {
          throw new Error(response?.message || "Unable to load addresses");
        }

        const fetched = Array.isArray(response.data) ? response.data : [];
        setAddresses(fetched);

        if (!fetched.length) {
          setSelectedAddress(null);
          return;
        }

        let nextSelected = focusAddressId;
        if (nextSelected) {
          const exists = fetched.some(
            (entry) => resolveAddressId(entry) === nextSelected
          );
          if (!exists) {
            nextSelected = null;
          }
        }

        if (!nextSelected) {
          const preferred =
            fetched.find((entry) => entry.isCurrentAddress) ||
            fetched.find((entry) => entry.isDefaultShipping) ||
            fetched[0];
          nextSelected = resolveAddressId(preferred);
        }

        setSelectedAddress(nextSelected);
      } catch (error) {
        setAddressesError(error.message || "Unable to load addresses");
        setAddresses([]);
        setSelectedAddress(null);
      } finally {
        setAddressesLoading(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    if (!userId) {
      setAddresses([]);
      setSelectedAddress(null);
      setShowAdd(false);
      setNewAddress(INITIAL_ADDRESS_FORM);
      return;
    }

    loadAddresses();
  }, [userId, loadAddresses]);

  const handleSaveAddress = async () => {
    if (!userId) {
      showToast("Sign in to save an address", { type: "info" });
      return;
    }

    if (
      !newAddress.addressLine1 ||
      !newAddress.city ||
      !newAddress.state ||
      !newAddress.pincode
    ) {
      showToast("Address line 1, city, state, and pincode are required", {
        type: "warning",
      });
      return;
    }

    setIsSavingAddress(true);
    try {
      const derivedLabel =
        newAddress.label?.trim() ||
        (newAddress.tag === "work"
          ? "Work"
          : newAddress.tag === "other"
          ? "Other"
          : "Home");

      const payload = {
        ...newAddress,
        label: derivedLabel,
      };

      if (!addresses.length) {
        payload.isCurrentAddress = true;
        payload.isDefaultShipping = true;
        payload.isDefaultBilling = true;
      }

      if (payload.isCurrentAddress) {
        payload.isDefaultShipping = true;
      }

      if (payload.pincode != null) {
        payload.pincode = String(payload.pincode).trim();
      }

      const response = await addressService.create(userId, payload);
      if (!response?.success) {
        throw new Error(response?.message || "Failed to save address");
      }

      const created = response.data || null;
      const createdId = resolveAddressId(created);

      showToast("Address saved", { type: "success" });
      setNewAddress(INITIAL_ADDRESS_FORM);
      setShowAdd(false);

      await loadAddresses(createdId);
    } catch (error) {
      showToast(error.message || "Unable to save address", { type: "error" });
    } finally {
      setIsSavingAddress(false);
    }
  };

  const submitOrder = useCallback(
    async (orderPayloadOverrides = {}) => {
      const response = await orderService.createOrder(orderPayloadOverrides);
      if (!response?.success) {
        throw new Error(response?.message || "Unable to place order");
      }

      showToast("Order placed successfully", { type: "success" });
      clearCart();
      navigate("/orders");
    },
    [clearCart, navigate, showToast]
  );

  const handlePay = async () => {
    if (!cart.length) {
      showToast("Your cart is empty", { type: "info" });
      return;
    }

    if (total <= 0) {
      showToast("Order total must be greater than zero", { type: "warning" });
      return;
    }

    const address = addresses.find(
      (entry) => resolveAddressId(entry) === selectedAddress
    );

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
        id: address._id || address.id,
        label: address.label,
        tag: address.tag,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        landmark: address.landmark,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        isDefaultShipping: address.isDefaultShipping,
        isDefaultBilling: address.isDefaultBilling,
        isCurrentAddress: address.isCurrentAddress,
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

      const shippingSummary = [
        address.addressLine1,
        address.addressLine2,
        address.landmark,
        [address.city, address.state].filter(Boolean).join(", ") || null,
        address.pincode ? `PIN ${address.pincode}` : null,
      ]
        .filter(Boolean)
        .join(" · ");

      const options = {
        key: paymentInit.key,
        amount: paymentInit.amount,
        currency: paymentInit.currency,
        name: "Cartify",
        description: "Secure payment",
        order_id: paymentInit.orderId,
        prefill: {
          email: user?.email || "shopper@example.com",
          contact: user?.phone || "",
        },
        notes: {
          shippingAddress: `${address.label}${
            shippingSummary ? `: ${shippingSummary}` : ""
          }`,
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
  };

  return (
    <div style={styles.page}>
      <NavBar user={user} onLogout={onLogout} />
      <main style={styles.main}>
        <div style={styles.grid}>
          <section style={styles.card} aria-label="Order summary">
            <div style={styles.orderHeader}>
              <div>
                <h2 style={styles.orderTitle}>Order summary</h2>
                <p style={styles.orderMeta}>
                  {cart.length
                    ? `${totalQuantity} item${
                        totalQuantity === 1 ? "" : "s"
                      } ready for checkout`
                    : "Your cart is empty"}
                </p>
              </div>
              {cart.length > 0 && <span style={styles.badgePill}>Cart</span>}
            </div>

            {cart.length === 0 ? (
              <p style={{ ...styles.orderMeta, marginTop: "8px" }}>
                Add products to review them here.
              </p>
            ) : (
              <div style={styles.orderItems}>
                {cart.map((item, index) => {
                  const cartItemId =
                    resolveCartItemId(item) || `cart-item-${index}`;
                  const quantity = item.quantity || 1;
                  const handleDecrease = () => {
                    const pid = resolveCartItemId(item);
                    if (!pid) return;
                    const nextQty = (item.quantity || 0) - 1;
                    if (nextQty <= 0) {
                      removeFromCart(pid);
                      showToast("Item removed from cart", { type: "info" });
                      return;
                    }
                    updateQuantity(pid, nextQty);
                  };
                  const handleIncrease = () => {
                    const pid = resolveCartItemId(item);
                    if (!pid) return;
                    updateQuantity(pid, (item.quantity || 0) + 1);
                  };
                  return (
                    <div key={cartItemId} style={styles.orderItem}>
                      <div style={styles.orderItemImage}>
                        <img
                          src={resolveItemImage(item)}
                          alt={item.title || "Product"}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                      <div style={styles.orderItemInfo}>
                        <span style={styles.orderItemTitle}>
                          {item.title || "Cartify item"}
                        </span>
                        <span style={styles.orderItemSub}>
                          Qty {quantity} · {formatINR(item.price)} each
                        </span>
                        <div style={styles.orderQtyControls}>
                          <button
                            type="button"
                            onClick={handleDecrease}
                            style={styles.qtyButton}
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>
                          <span style={styles.qtyValue}>{quantity}</span>
                          <button
                            type="button"
                            onClick={handleIncrease}
                            style={styles.qtyButton}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <span style={styles.orderItemPrice}>
                        {formatINR(item.price * quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {cart.length > 0 && (
              <div style={styles.subtotalRow}>
                <span>Subtotal</span>
                <span>{formatINR(total)}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => navigate("/cart")}
              style={styles.subtleButton}
            >
              Back to cart
            </button>

            <div style={styles.paymentSection}>
              <div style={styles.deliveryHeader}>
                <h3 style={styles.deliveryTitle}>Payment</h3>
              </div>
              {["card", "cod", "upi"].map((method) => {
                const labels = {
                  card: "Debit/Credit card",
                  cod: "Cash on delivery",
                  upi: "UPI",
                };
                const descriptions = {
                  card: "Pay securely with any major card.",
                  cod: "Pay when the order arrives at your doorstep.",
                  upi: "Use your preferred UPI app for instant payment.",
                };
                return (
                  <label
                    key={method}
                    style={styles.paymentOption(paymentMethod === method)}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      checked={paymentMethod === method}
                      onChange={() => setPaymentMethod(method)}
                    />
                    <div>
                      <div style={{ fontWeight: 600, color: "#1f2937" }}>
                        {labels[method]}
                      </div>
                      <div style={styles.paymentMeta}>
                        {descriptions[method]}
                      </div>
                    </div>
                  </label>
                );
              })}

              <div style={styles.paymentFooter}>
                <button
                  type="button"
                  onClick={handlePay}
                  style={{
                    ...styles.primaryButton,
                    ...(isPayDisabled ? styles.primaryButtonDisabled : {}),
                  }}
                  disabled={isPayDisabled}
                >
                  {isPlacingOrder
                    ? "Placing order..."
                    : `Pay ${formatINR(total)}`}
                </button>
                <span style={styles.orderMeta}>
                  Secure checkout powered by Razorpay. Easy returns guaranteed.
                </span>
              </div>
            </div>
          </section>

          <aside style={styles.card} aria-label="Delivery address">
            <div style={styles.deliveryHeader}>
              <h3 style={styles.deliveryTitle}>Delivery address</h3>
              {addresses.length > 0 && (
                <span style={styles.badgePill}>Saved {addresses.length}</span>
              )}
            </div>

            <div style={styles.addressList}>
              {addressesLoading && (
                <p style={styles.orderMeta}>Loading saved addresses…</p>
              )}

              {addressesError && (
                <p style={{ color: "#dc2626", fontSize: "0.9rem" }}>
                  {addressesError}
                </p>
              )}

              {!addressesLoading &&
                !addressesError &&
                addresses.length === 0 && (
                  <p style={styles.orderMeta}>
                    {userId
                      ? "No saved addresses yet. Add one to continue."
                      : "Sign in to manage your delivery addresses."}
                  </p>
                )}

              {addresses.map((address, index) => {
                const addrId = resolveAddressId(address);
                const lineTwo = [address.addressLine2, address.landmark]
                  .filter(Boolean)
                  .join(", ");
                const locality = [address.city, address.state]
                  .filter(Boolean)
                  .join(", ");
                const lines = [
                  address.addressLine1,
                  lineTwo,
                  [locality, address.pincode].filter(Boolean).join(" - "),
                ].filter((line) => line && line.trim().length > 0);

                const badges = [];
                if (address.tag) {
                  badges.push(
                    address.tag.charAt(0).toUpperCase() + address.tag.slice(1)
                  );
                }
                if (address.isCurrentAddress) {
                  badges.push("Current");
                } else if (address.isDefaultShipping) {
                  badges.push("Default shipping");
                }
                if (address.isDefaultBilling) {
                  badges.push("Default billing");
                }

                return (
                  <label
                    key={addrId || `addr-${index}`}
                    style={styles.addressOption(addrId === selectedAddress)}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddress === addrId}
                      onChange={() => setSelectedAddress(addrId)}
                      style={{ marginTop: "6px" }}
                    />
                    <div style={styles.addressBody}>
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span style={{ fontWeight: 700, color: "#1f2937" }}>
                          {address.label || "Saved address"}
                        </span>
                        {badges.map((badge) => (
                          <span key={badge} style={styles.badgePill}>
                            {badge}
                          </span>
                        ))}
                      </div>
                      {lines.map((line, idx) => (
                        <span key={idx}>{line}</span>
                      ))}
                    </div>
                  </label>
                );
              })}

              <button
                type="button"
                onClick={handleToggleAdd}
                style={styles.addAddressButton}
                disabled={!userId}
              >
                {showAdd ? "Cancel" : "Add new address"}
              </button>

              {showAdd && (
                <div style={styles.addressForm}>
                  <input
                    placeholder="Label"
                    value={newAddress.label}
                    onChange={(event) =>
                      handleNewAddressChange("label", event.target.value)
                    }
                    style={styles.input}
                  />
                  <input
                    placeholder="Address line 1 *"
                    value={newAddress.addressLine1}
                    onChange={(event) =>
                      handleNewAddressChange("addressLine1", event.target.value)
                    }
                    style={styles.input}
                  />
                  <input
                    placeholder="Address line 2"
                    value={newAddress.addressLine2}
                    onChange={(event) =>
                      handleNewAddressChange("addressLine2", event.target.value)
                    }
                    style={styles.input}
                  />
                  <input
                    placeholder="Landmark"
                    value={newAddress.landmark}
                    onChange={(event) =>
                      handleNewAddressChange("landmark", event.target.value)
                    }
                    style={styles.input}
                  />
                  <div style={styles.inputGrid}>
                    <input
                      placeholder="City *"
                      value={newAddress.city}
                      onChange={(event) =>
                        handleNewAddressChange("city", event.target.value)
                      }
                      style={styles.input}
                    />
                    <input
                      placeholder="State *"
                      value={newAddress.state}
                      onChange={(event) =>
                        handleNewAddressChange("state", event.target.value)
                      }
                      style={styles.input}
                    />
                    <input
                      placeholder="Pincode *"
                      value={newAddress.pincode}
                      onChange={(event) =>
                        handleNewAddressChange("pincode", event.target.value)
                      }
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.tagRow}>
                    {[
                      { value: "home", label: "Home" },
                      { value: "work", label: "Work" },
                      { value: "other", label: "Other" },
                    ].map((option) => (
                      <label
                        key={option.value}
                        style={styles.tagOption(
                          newAddress.tag === option.value
                        )}
                      >
                        <input
                          type="radio"
                          name="address-tag"
                          checked={newAddress.tag === option.value}
                          onChange={() =>
                            handleNewAddressChange("tag", option.value)
                          }
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>

                  <div style={styles.checkboxRow}>
                    <label>
                      <input
                        type="checkbox"
                        checked={newAddress.isCurrentAddress}
                        onChange={(event) =>
                          handleNewAddressChange(
                            "isCurrentAddress",
                            event.target.checked
                          )
                        }
                      />
                      <span style={{ marginLeft: "6px" }}>
                        Set as current delivery address
                      </span>
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={newAddress.isDefaultBilling}
                        onChange={(event) =>
                          handleNewAddressChange(
                            "isDefaultBilling",
                            event.target.checked
                          )
                        }
                      />
                      <span style={{ marginLeft: "6px" }}>
                        Mark as default billing address
                      </span>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveAddress}
                    style={{
                      ...styles.primaryButton,
                      width: "fit-content",
                      padding: "10px 18px",
                    }}
                    disabled={isSavingAddress}
                  >
                    {isSavingAddress ? "Saving…" : "Save address"}
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f6f9ff 0%, #ffffff 60%)",
  },
  main: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "32px 24px 64px",
  },
  grid: {
    display: "grid",
    gap: "24px",
    alignItems: "start",
    gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
  },
  card: {
    background: "#ffffff",
    borderRadius: "22px",
    padding: "30px",
    boxShadow: "0 25px 50px -12px rgba(30, 64, 175, 0.18)",
    border: "1px solid rgba(148, 163, 184, 0.25)",
  },
  orderHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    marginBottom: "24px",
  },
  orderTitle: {
    margin: 0,
    fontSize: "1.6rem",
    fontWeight: 700,
    color: "#0f172a",
  },
  orderMeta: {
    margin: 0,
    fontSize: "0.95rem",
    color: "#64748b",
  },
  badgePill: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px 12px",
    borderRadius: "999px",
    fontSize: "0.75rem",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    background: "rgba(67, 56, 202, 0.12)",
    color: "#4338ca",
  },
  orderItems: {
    display: "grid",
    gap: "18px",
  },
  orderItem: {
    display: "grid",
    gridTemplateColumns: "72px 1fr auto",
    gap: "16px",
    alignItems: "center",
  },
  orderItemImage: {
    width: "72px",
    height: "72px",
    borderRadius: "16px",
    overflow: "hidden",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
  },
  orderItemInfo: {
    display: "grid",
    gap: "6px",
  },
  orderItemTitle: {
    fontWeight: 600,
    color: "#111827",
  },
  orderItemSub: {
    fontSize: "0.9rem",
    color: "#6b7280",
  },
  orderItemPrice: {
    fontWeight: 600,
    color: "#0f172a",
  },
  orderQtyControls: {
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "8px",
  },
  qtyButton: {
    width: "30px",
    height: "30px",
    borderRadius: "999px",
    border: "1px solid #cbd5f5",
    background: "#ffffff",
    fontSize: "1.2rem",
    fontWeight: 600,
    color: "#1d4ed8",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.2s ease, border-color 0.2s ease",
  },
  qtyValue: {
    minWidth: "28px",
    textAlign: "center",
    fontWeight: 600,
    color: "#1f2937",
  },
  subtotalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "20px",
    marginTop: "24px",
    borderTop: "1px solid #e2e8f0",
    fontWeight: 600,
    color: "#0f172a",
    fontSize: "1.05rem",
  },
  subtleButton: {
    marginTop: "24px",
    width: "100%",
    background: "transparent",
    border: "1px solid #cbd5f5",
    borderRadius: "12px",
    padding: "12px",
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#1d4ed8",
    cursor: "pointer",
    transition: "background 0.2s ease, border-color 0.2s ease",
  },
  deliveryHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
  },
  deliveryTitle: {
    margin: 0,
    fontSize: "1.35rem",
    fontWeight: 700,
    color: "#0f172a",
  },
  addressList: {
    display: "grid",
    gap: "14px",
  },
  addressOption: (isActive) => ({
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "16px",
    borderRadius: "16px",
    border: `1px solid ${isActive ? "#4338ca" : "#e2e8f0"}`,
    background: isActive ? "rgba(99, 102, 241, 0.08)" : "#f8fafc",
    transition: "border-color 0.2s ease, background 0.2s ease",
    cursor: "pointer",
  }),
  addressBody: {
    display: "grid",
    gap: "6px",
    fontSize: "0.92rem",
    color: "#475569",
  },
  addAddressButton: {
    marginTop: "4px",
    alignSelf: "flex-start",
    background: "#1d4ed8",
    color: "#ffffff",
    border: "none",
    borderRadius: "999px",
    padding: "10px 20px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s ease",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  },
  addressForm: {
    display: "grid",
    gap: "12px",
    marginTop: "16px",
    padding: "18px",
    borderRadius: "16px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
  },
  input: {
    width: "100%",
    borderRadius: "12px",
    border: "1px solid #dbeafe",
    padding: "10px 14px",
    fontSize: "0.95rem",
    color: "#0f172a",
    background: "#ffffff",
  },
  inputGrid: {
    display: "grid",
    gap: "12px",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  },
  tagRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },
  tagOption: (isActive) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 14px",
    borderRadius: "999px",
    border: `1px solid ${isActive ? "#4338ca" : "#dbeafe"}`,
    background: isActive ? "rgba(99, 102, 241, 0.12)" : "#ffffff",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: isActive ? "#312e81" : "#475569",
    cursor: "pointer",
  }),
  checkboxRow: {
    display: "grid",
    gap: "8px",
    fontSize: "0.9rem",
    color: "#475569",
  },
  primaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "12px 22px",
    borderRadius: "999px",
    border: "none",
    fontWeight: 600,
    fontSize: "0.97rem",
    color: "#ffffff",
    background: "linear-gradient(135deg, #4338ca 0%, #1d4ed8 100%)",
    boxShadow: "0 15px 30px -15px rgba(30, 64, 175, 0.6)",
    cursor: "pointer",
    transition: "transform 0.15s ease, box-shadow 0.2s ease",
  },
  primaryButtonDisabled: {
    background: "#c7d2fe",
    boxShadow: "none",
    cursor: "not-allowed",
  },
  paymentSection: {
    marginTop: "28px",
    display: "grid",
    gap: "16px",
    paddingTop: "24px",
    borderTop: "1px solid #e2e8f0",
  },
  paymentOption: (isActive) => ({
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
    padding: "14px 16px",
    borderRadius: "14px",
    border: `1px solid ${isActive ? "#4338ca" : "#e2e8f0"}`,
    background: isActive ? "rgba(79, 70, 229, 0.08)" : "#f8fafc",
    cursor: "pointer",
    transition: "border-color 0.2s ease, background 0.2s ease",
  }),
  paymentMeta: {
    fontSize: "0.9rem",
    color: "#64748b",
    marginTop: "4px",
  },
  paymentFooter: {
    display: "grid",
    gap: "12px",
  },
};

export default PlaceOrder;
