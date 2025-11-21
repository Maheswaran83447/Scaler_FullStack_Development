import React, { useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import { CartContext } from "../context/CartContext";

const PRODUCT_PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80";

const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    Number(value) || 0
  );

const resolveItemImage = (item) => {
  if (!item) return PRODUCT_PLACEHOLDER_IMAGE;
  if (item.image) return item.image;
  if (Array.isArray(item.images) && item.images.length > 0) {
    return item.images[0];
  }
  return PRODUCT_PLACEHOLDER_IMAGE;
};

const resolveUnitPrice = (item) => {
  const discount = Number(item?.discountPrice);
  if (!Number.isNaN(discount) && discount > 0) {
    return discount;
  }
  const price = Number(item?.price);
  return Number.isNaN(price) ? 0 : price;
};

const resolveOriginalPrice = (item) => {
  const price = Number(item?.price);
  return Number.isNaN(price) ? 0 : price;
};

const Cart = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, clearCart } =
    useContext(CartContext);

  const hasItems = cart.length > 0;
  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + (item.quantity || 0), 0),
    [cart]
  );
  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + resolveUnitPrice(item) * (item.quantity || 1),
        0
      ),
    [cart]
  );

  const handleDecrement = (item) => {
    const current = item.quantity || 1;
    if (current <= 1) {
      removeFromCart(item.id);
      return;
    }
    updateQuantity(item.id, current - 1);
  };

  const handleIncrement = (item) => {
    const next = (item.quantity || 1) + 1;
    updateQuantity(item.id, next);
  };

  const handleQuantityInput = (id, rawValue) => {
    const parsed = Number(rawValue);
    if (Number.isNaN(parsed)) return;
    if (parsed <= 0) {
      removeFromCart(id);
      return;
    }
    updateQuantity(id, parsed);
  };

  const handleProceedToCheckout = () => navigate("/checkout");
  const handleContinueShopping = () => navigate("/products");

  return (
    <div className="cart-page">
      <NavBar user={user} onLogout={onLogout} />
      <main className="cart-page-main">
        <header className="cart-page-header">
          <div>
            <h1>Shopping Cart</h1>
            <p className="cart-page-subtitle">
              {hasItems
                ? `You have ${totalItems} item${
                    totalItems === 1 ? "" : "s"
                  } ready to checkout.`
                : "Your cart feels a little light. Let’s add something you love."}
            </p>
          </div>
          {hasItems && (
            <button
              type="button"
              className="cart-clear-btn"
              onClick={clearCart}
            >
              Clear cart
            </button>
          )}
        </header>

        {!hasItems ? (
          <section className="cart-empty-state">
            <div className="cart-empty-illustration" aria-hidden="true">
              🛒
            </div>
            <h2>Your cart is empty</h2>
            <p>Discover exclusive deals and add products to get started.</p>
            <button
              type="button"
              className="cart-primary-btn"
              onClick={handleContinueShopping}
            >
              Browse products
            </button>
          </section>
        ) : (
          <div className="cart-layout">
            <section className="cart-items">
              {cart.map((item) => {
                const { id, title } = item;
                const quantity = Math.max(1, item.quantity || 1);
                const unitPrice = resolveUnitPrice(item);
                const originalPrice = resolveOriginalPrice(item);
                const lineTotal = unitPrice * quantity;
                const showOriginal =
                  originalPrice > unitPrice && originalPrice !== 0;
                const imageSrc = resolveItemImage(item);

                return (
                  <article key={id} className="cart-item-card">
                    <div className="cart-item-media">
                      <img src={imageSrc} alt={title || "Product thumbnail"} />
                    </div>
                    <div className="cart-item-content">
                      <div className="cart-item-header">
                        <h3 className="cart-item-title">{title}</h3>
                        <button
                          type="button"
                          className="cart-item-remove"
                          onClick={() => removeFromCart(id)}
                        >
                          Remove
                        </button>
                      </div>
                      <div className="cart-item-pricing">
                        <span className="cart-item-price">
                          {formatINR(unitPrice)}
                        </span>
                        {showOriginal && (
                          <span className="cart-item-original">
                            {formatINR(originalPrice)}
                          </span>
                        )}
                      </div>
                      <div className="cart-item-actions">
                        <div
                          className="cart-qty-control"
                          aria-label="Quantity selector"
                        >
                          <button
                            type="button"
                            className="cart-qty-btn"
                            onClick={() => handleDecrement(item)}
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={quantity}
                            onChange={(event) =>
                              handleQuantityInput(id, event.target.value)
                            }
                            className="cart-qty-input"
                            aria-label="Quantity"
                          />
                          <button
                            type="button"
                            className="cart-qty-btn"
                            onClick={() => handleIncrement(item)}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                        <div className="cart-item-total">
                          <span>Total</span>
                          <strong>{formatINR(lineTotal)}</strong>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            <aside className="cart-summary" aria-label="Order summary">
              <h2>Order summary</h2>
              <ul className="cart-summary-list">
                <li className="cart-summary-row">
                  <span>Items ({totalItems})</span>
                  <span>{formatINR(subtotal)}</span>
                </li>
                <li className="cart-summary-row">
                  <span>Delivery</span>
                  <span className="cart-summary-tag">Free</span>
                </li>
              </ul>
              <div className="cart-summary-total">
                <span>Grand total</span>
                <strong>{formatINR(subtotal)}</strong>
              </div>
              <p className="cart-summary-note">
                Secure checkout and easy returns on every order.
              </p>
              <div className="cart-summary-actions">
                <button
                  type="button"
                  className="cart-secondary-btn"
                  onClick={handleContinueShopping}
                >
                  Continue shopping
                </button>
                <button
                  type="button"
                  className="cart-primary-btn"
                  onClick={handleProceedToCheckout}
                >
                  Proceed to checkout
                </button>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
};

export default Cart;
