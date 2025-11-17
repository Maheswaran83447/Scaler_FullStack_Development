import { useContext, useEffect, useMemo, useState } from "react";
import NavBar from "../components/NavBar";
import { ToastContext } from "../context/ToastContext";
import { CartContext } from "../context/CartContext";
import orderService from "../services/orderService";

const formatDate = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (err) {
    return "—";
  }
};

const buildSummary = (items = []) => {
  if (!items.length) return "No items";
  if (items.length === 1) {
    const item = items[0];
    return `${item.name} x${item.quantity || 1}`;
  }
  const first = items[0];
  return `${first.name} x${first.quantity || 1} + ${items.length - 1} more`;
};

const filterOptions = () => {
  const now = new Date();
  const startOfMonthAgo = (months) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() - months);
    return d;
  };
  const startOfYear = (year) => new Date(year, 0, 1);
  const endOfYear = (year) => new Date(year, 11, 31, 23, 59, 59, 999);
  const currentYear = now.getFullYear();

  return [
    {
      label: "Last 1 month",
      id: "1m",
      getRange: () => ({ from: startOfMonthAgo(1), to: now }),
    },
    {
      label: "Last 3 months",
      id: "3m",
      getRange: () => ({ from: startOfMonthAgo(3), to: now }),
    },
    {
      label: "Last 6 months",
      id: "6m",
      getRange: () => ({ from: startOfMonthAgo(6), to: now }),
    },
    {
      label: `Year to date (${currentYear})`,
      id: `ytd-${currentYear}`,
      getRange: () => ({ from: startOfYear(currentYear), to: now }),
    },
    {
      label: `${currentYear - 1}`,
      id: `year-${currentYear - 1}`,
      getRange: () => ({
        from: startOfYear(currentYear - 1),
        to: endOfYear(currentYear - 1),
      }),
    },
  ];
};

const OrderHistory = ({ user, onLogout }) => {
  const { showToast } = useContext(ToastContext);
  const { addToCart } = useContext(CartContext);
  const options = useMemo(filterOptions, []);
  const [selectedFilter, setSelectedFilter] = useState(options[0].id);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOrders = async (rangeOption) => {
    setLoading(true);
    setError(null);
    try {
      const { from, to } = rangeOption.getRange();
      const response = await orderService.fetchOrders({
        from: from?.toISOString(),
        to: to?.toISOString(),
      });
      if (response?.success) {
        setOrders(response.data || []);
      } else {
        setError(response?.message || "Unable to load orders");
        setOrders([]);
      }
    } catch (err) {
      setError(err.message || "Unable to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const option =
      options.find((opt) => opt.id === selectedFilter) || options[0];
    loadOrders(option);
  }, [options, selectedFilter]);

  const handleFilterChange = (event) => {
    setSelectedFilter(event.target.value);
  };

  const handleRepeatOrder = (order) => {
    if (!order?.items?.length) {
      showToast("No items available for repeat order", { type: "info" });
      return;
    }

    order.items.forEach((item, index) => {
      const productId =
        item.productId || item.product?._id || `${order._id}-${index}`;
      addToCart(
        {
          id: productId,
          title: item.name,
          name: item.name,
          price: item.price,
        },
        item.quantity || 1
      );
    });

    showToast("Items added to your cart", { type: "success" });
  };

  return (
    <div>
      <NavBar user={user} onLogout={onLogout} />
      <main className="orders-page">
        <header className="orders-header">
          <div>
            <h1>Your orders</h1>
            <p>Review and reorder your past purchases.</p>
          </div>
          <label className="orders-filter">
            <span>Show orders from</span>
            <select value={selectedFilter} onChange={handleFilterChange}>
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </header>

        {loading && <p className="orders-status">Loading your orders…</p>}
        {error && !loading && (
          <p className="orders-status orders-status-error">{error}</p>
        )}

        {!loading && !error && orders.length === 0 && (
          <p className="orders-status">No orders found for this period.</p>
        )}

        {!loading && !error && orders.length > 0 && (
          <section className="orders-list">
            {orders.map((order) => {
              const placedDate = formatDate(order.placedAt);
              const receivedDate =
                order.status === "delivered"
                  ? formatDate(order.updatedAt)
                  : "Arriving soon";
              const title = order.items?.[0]?.name || "Cartify Order";
              const summary = buildSummary(order.items);
              const orderNumber = order.orderNumber || order._id;

              return (
                <article className="order-card" key={order._id}>
                  <div className="order-card-header">
                    <div>
                      <h2>{title}</h2>
                      <p className="order-summary">{summary}</p>
                      {orderNumber && (
                        <p className="order-id" title={orderNumber}>
                          <span className="meta-label">Order ID:</span>{" "}
                          <span className="order-id-value">{orderNumber}</span>
                        </p>
                      )}
                    </div>
                    <div className="order-price">
                      ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div className="order-meta">
                    <div>
                      <span className="meta-label">Placed</span>
                      <span>{placedDate}</span>
                    </div>
                    <div>
                      <span className="meta-label">Status</span>
                      <span className={`status-pill status-${order.status}`}>
                        {order.status}
                      </span>
                    </div>
                    <div>
                      <span className="meta-label">Received</span>
                      <span>{receivedDate}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="repeat-button"
                    onClick={() => handleRepeatOrder(order)}
                  >
                    Repeat order
                  </button>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
};

export default OrderHistory;
