import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./nav.css";
import { CartContext } from "../context/CartContext";
import addressService from "../services/addressService";

const resolveUserId = (currentUser) => {
  if (!currentUser || currentUser.isGuest) return null;
  const raw =
    currentUser._id ||
    currentUser.id ||
    currentUser.userId ||
    currentUser.user_id ||
    null;
  if (raw == null) return null;
  const normalized = String(raw).trim();
  if (!normalized || normalized.toLowerCase() === "guest") {
    return null;
  }
  return normalized;
};

const NavBar = ({ user, onLogout }) => {
  const { cartCount } = useContext(CartContext);
  const navigate = useNavigate();
  const resolvedUserId = resolveUserId(user);
  const isLoggedIn = Boolean(resolvedUserId);
  const isGuest = Boolean(user?.isGuest);

  const API_BASE = useMemo(
    () => import.meta.env.VITE_API_URL || "http://localhost:5001",
    []
  );

  const formatINR = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value));

  const DELIVERY_STORAGE_KEY = "cartify_delivery_location";
  const defaultLocation = {
    city: "Chennai",
    pincode: "600001",
  };

  const deriveLocationFromAddressEntry = (address) => {
    if (!address) return null;
    const city = address.city || address.town || address.district || "";
    const pincode =
      address.pincode || address.postalCode || address.zipcode || "";
    const addressLine1 =
      address.addressLine1 || address.street || address.label || "";

    if (!addressLine1 && !city && !pincode) return null;

    return {
      city: city || "",
      pincode: pincode ? String(pincode) : "",
    };
  };

  const deriveLocationFromUser = (currentUser) => {
    if (!currentUser || currentUser.isGuest) return null;
    const fromAddress = currentUser.address || currentUser.currentAddress || {};
    const city = fromAddress.city || currentUser.city;
    const pincode =
      fromAddress.pincode || fromAddress.postalCode || currentUser.pincode;
    if (city && pincode) {
      return {
        city,
        pincode: String(pincode),
      };
    }
    return null;
  };
  const [location, setLocation] = useState(() => {
    const fromUser = deriveLocationFromUser(user);
    if (fromUser) return fromUser;
    if (typeof window !== "undefined") {
      try {
        const stored = window.localStorage.getItem(DELIVERY_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.city && parsed?.pincode) return parsed;
        }
      } catch (err) {
        // ignore storage access issues
      }
    }
    return defaultLocation;
  });

  useEffect(() => {
    const fromUser = deriveLocationFromUser(user);
    if (fromUser) {
      setLocation(fromUser);
    } else if (!user || isGuest) {
      setLocation(defaultLocation);
    }
  }, [user, isGuest]);

  useEffect(() => {
    let cancelled = false;
    const userId = resolvedUserId;

    const isValidObjectId =
      typeof userId === "string" && /^[a-f\d]{24}$/i.test(userId);
    if (!isValidObjectId) {
      return () => {
        cancelled = true;
      };
    }

    const loadCurrentAddress = async () => {
      try {
        const response = await addressService.list(userId);
        if (!response?.success) return;
        const addresses = Array.isArray(response.data) ? response.data : [];
        if (!addresses.length) return;

        const currentAddress =
          addresses.find((addr) => addr.isCurrentAddress) ||
          addresses.find((addr) => addr.isDefaultShipping) ||
          addresses[0];

        const resolved = deriveLocationFromAddressEntry(currentAddress);
        if (resolved && !cancelled) {
          setLocation(resolved);
        }
      } catch (error) {
        console.warn("Failed to load delivery location", error);
      }
    };

    loadCurrentAddress();

    return () => {
      cancelled = true;
    };
  }, [resolvedUserId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        DELIVERY_STORAGE_KEY,
        JSON.stringify(location)
      );
    } catch (err) {
      // ignore storage write issues
    }
  }, [location]);

  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    if (searchTerm.trim().length < 3) {
      setSuggestions([]);
      setSearchError(null);
      setSearchLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setSearchLoading(true);
      setSearchError(null);

      fetch(
        `${API_BASE}/api/products/search?q=${encodeURIComponent(
          searchTerm.trim()
        )}`,
        { signal: controller.signal }
      )
        .then((res) => res.json())
        .then((body) => {
          if (controller.signal.aborted) return;
          if (body?.success) {
            setSuggestions(body.data || []);
          } else {
            setSuggestions([]);
            setSearchError(body?.message || "Search failed");
          }
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          setSuggestions([]);
          if (err.name !== "AbortError") {
            setSearchError(err.message || "Unable to search");
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearchLoading(false);
        });
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [API_BASE, searchTerm]);

  const handleSelectSuggestion = (product) => {
    if (!product) return;
    const targetId = product._id || product.id;
    if (!targetId) return;
    setSearchTerm("");
    setSuggestions([]);
    setIsFocused(false);
    navigate(`/products/${targetId}`);
  };

  const showSuggestions =
    isFocused &&
    (searchTerm.trim().length >= 3 || searchLoading || searchError);

  const deliveryLabel = [location.city, location.pincode]
    .filter((part) => typeof part === "string" && part.trim().length)
    .join(" · ");

  useEffect(() => {
    if (!profileOpen) return undefined;

    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [profileOpen]);

  useEffect(() => {
    if (!isLoggedIn) {
      setProfileOpen(false);
    }
  }, [isLoggedIn]);

  const handleProfileToggle = () => {
    if (!isLoggedIn) {
      navigate("/", { replace: false });
      return;
    }
    setProfileOpen((open) => !open);
  };

  const handleLoginClick = () => {
    navigate("/", { replace: false });
  };

  return (
    <nav className="site-nav">
      <div className="nav-left">
        <Link to="/home" className="brand" aria-label="Cartify home">
          <svg
            width="320"
            height="80"
            viewBox="0 0 320 80"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-labelledby="title desc"
          >
            <title id="title">Cartify geometric diagonal basket logo</title>
            <desc id="desc">
              A geometric cart with diagonal basket lines and a clean sans-serif
              wordmark.
            </desc>
            <g
              fill="none"
              stroke="#163D7A"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M20 26c10-2 24-2 36 0l-4 18c-1 4-3 6-7 6H32" />
              <line x1="52" y1="26" x2="64" y2="40" />
              <line x1="48" y1="26" x2="60" y2="40" />
              <line x1="44" y1="26" x2="56" y2="40" />
              <circle cx="34" cy="52" r="4" fill="#163D7A" stroke="none" />
              <circle cx="48" cy="52" r="4" fill="#163D7A" stroke="none" />
              <path d="M12 22h8" />
              <path d="M12 22l7 22h32" />
            </g>
            <text
              x="84"
              y="56"
              font-family="Inter, Arial, sans-serif"
              font-size="32"
              fill="#163D7A"
              letter-spacing="0.1"
            >
              Cartify
            </text>
          </svg>
        </Link>
        <div className="delivery-info" aria-label="Current delivery location">
          <span className="delivery-icon" aria-hidden="true">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"
                fill="#f05a28"
              />
            </svg>
          </span>
          <span className="delivery-label">Delivery to</span>
          <span className="delivery-location">{deliveryLabel}</span>
        </div>
      </div>
      <div className="nav-center">
        <div className="search-wrapper">
          <input
            type="search"
            className="nav-search"
            value={searchTerm}
            placeholder="Search for products"
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 150)}
            aria-label="Search products"
            onKeyDown={(event) => {
              if (event.key === "Enter" && suggestions[0]) {
                event.preventDefault();
                handleSelectSuggestion(suggestions[0]);
              } else if (event.key === "Escape") {
                setIsFocused(false);
                setSuggestions([]);
              }
            }}
          />
          {showSuggestions && (
            <div className="search-results" role="listbox">
              {searchError && (
                <div className="search-empty" role="alert">
                  {searchError}
                </div>
              )}
              {!searchError && searchLoading && (
                <div className="search-empty">Searching…</div>
              )}
              {!searchError && !searchLoading && suggestions.length === 0 && (
                <div className="search-empty">
                  {searchTerm.trim().length < 3
                    ? "Type at least 3 letters"
                    : "No products found"}
                </div>
              )}
              {!searchError &&
                !searchLoading &&
                suggestions.map((product) => {
                  const productId = product._id || product.id;
                  return (
                    <button
                      type="button"
                      key={productId}
                      className="search-item"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectSuggestion(product);
                      }}
                    >
                      <span className="search-item-title">{product.title}</span>
                      {product.price ? (
                        <span className="search-item-price">
                          {formatINR(product.price)}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      </div>
      <div className="nav-right">
        <div className="nav-profile" ref={profileMenuRef}>
          <button
            type="button"
            className="profile-toggle"
            onClick={handleProfileToggle}
            aria-haspopup="menu"
            aria-expanded={isLoggedIn ? profileOpen : false}
          >
            Profile
            <span
              className={`profile-caret${
                isLoggedIn && profileOpen ? " open" : ""
              }`}
              aria-hidden="true"
            />
          </button>
          {isLoggedIn && profileOpen && (
            <div className="profile-menu" role="menu">
              <Link
                to="/account"
                className="profile-item"
                role="menuitem"
                onClick={() => setProfileOpen(false)}
              >
                Your account
              </Link>
              <Link
                to="/orders"
                className="profile-item"
                role="menuitem"
                onClick={() => setProfileOpen(false)}
              >
                Your orders
              </Link>
              <Link
                to="/wishlist"
                className="profile-item"
                role="menuitem"
                onClick={() => setProfileOpen(false)}
              >
                Your wishlist
              </Link>
            </div>
          )}
        </div>
        <Link to="/cart" className="nav-link">
          Cart{cartCount ? ` (${cartCount})` : ""}
        </Link>
        {isLoggedIn ? (
          <button className="nav-logout" onClick={onLogout}>
            Logout
          </button>
        ) : (
          <button type="button" className="nav-link" onClick={handleLoginClick}>
            Login
          </button>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
