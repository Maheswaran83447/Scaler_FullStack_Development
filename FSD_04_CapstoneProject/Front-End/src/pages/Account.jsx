import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import { ToastContext } from "../context/ToastContext";
import addressService from "../services/addressService";
import authService from "../services/authService";
import "../styles/account.css";

const resolveUserId = (value) => {
  if (!value || value.isGuest) return null;
  return value._id || value.id || value.userId || null;
};

const IconHeadphones = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4 13a8 8 0 0 1 16 0v3a2 2 0 0 1-2 2h-1v-4h3"
      stroke="#312e81"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect
      x="3"
      y="12"
      width="4"
      height="8"
      rx="2"
      stroke="#312e81"
      strokeWidth="1.6"
    />
    <rect
      x="17"
      y="12"
      width="4"
      height="8"
      rx="2"
      stroke="#312e81"
      strokeWidth="1.6"
    />
  </svg>
);

const IconMail = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="3"
      y="5"
      width="18"
      height="14"
      rx="2"
      stroke="#1d4ed8"
      strokeWidth="1.6"
    />
    <path
      d="m5 7 7 6 7-6"
      stroke="#1d4ed8"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconPhone = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6 4h2l2 5-2 1a14 14 0 0 0 6 6l1.02-2.04L20 16v2a2 2 0 0 1-2.18 2A15.91 15.91 0 0 1 4 6.18 2 2 0 0 1 6 4Z"
      stroke="#16a34a"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconWhatsapp = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3 20.5 4 17a8 8 0 1 1 3 3l-4 0.5Z"
      stroke="#16a34a"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.5 10.5c0.5 1.5 1.5 2.5 3 3l1.5-1 2 1.5"
      stroke="#16a34a"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const resolveAddressId = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  const raw = value._id || value.id || value.addressId;
  return raw ? String(raw) : null;
};

const buildAddressLines = (address) => {
  if (!address) return [];
  const lineTwo = [address.addressLine2, address.landmark]
    .filter(Boolean)
    .join(", ");
  const locality = [address.city, address.state].filter(Boolean).join(", ");

  return [
    address.addressLine1,
    lineTwo,
    [locality, address.pincode].filter(Boolean).join(" - "),
  ].filter((line) => line && line.trim().length > 0);
};

const deriveDisplayName = (user) => {
  if (!user) return "";
  if (user.firstName || user.lastName) {
    return [user.firstName, user.lastName].filter(Boolean).join(" ");
  }
  return user.username || user.email || "Cartify shopper";
};

const getInitials = (name) => {
  if (!name) return "C";
  const parts = name.trim().split(/\s+/);
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "");
  return initials.join("") || "C";
};

const Account = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const { showToast } = useContext(ToastContext);
  const [activeSection, setActiveSection] = useState("profile");
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressesError, setAddressesError] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const userId = useMemo(() => resolveUserId(user), [user]);
  const isGuest = Boolean(user?.isGuest);
  const displayName = useMemo(() => deriveDisplayName(user), [user]);
  const avatarInitials = useMemo(() => getInitials(displayName), [displayName]);
  const avatarUrl = user?.profileAvatarUrl;

  useEffect(() => {
    if (!user || isGuest) {
      showToast("Sign in to manage your account", { type: "info" });
      navigate("/", { replace: true });
    }
  }, [user, isGuest, navigate, showToast]);

  const loadAddresses = useCallback(async () => {
    if (!userId) return;
    setAddressesLoading(true);
    setAddressesError("");
    try {
      const response = await addressService.list(userId);
      if (!response?.success) {
        throw new Error(response?.message || "Unable to load addresses");
      }
      const fetched = Array.isArray(response.data) ? response.data : [];
      setAddresses(fetched);
    } catch (error) {
      setAddressesError(error.message || "Unable to load addresses");
      setAddresses([]);
    } finally {
      setAddressesLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (activeSection === "addresses" && userId) {
      loadAddresses();
    }
  }, [activeSection, loadAddresses, userId]);

  const handleDeleteAddress = async (addressId) => {
    if (!addressId || !userId) return;
    try {
      await addressService.remove(addressId, userId);
      setAddresses((prev) =>
        prev.filter((entry) => resolveAddressId(entry) !== addressId)
      );
      showToast("Address removed", { type: "success" });
    } catch (error) {
      showToast(error.message || "Unable to delete address", { type: "error" });
    }
  };

  const handlePasswordFieldChange = (field, value) => {
    setPasswordForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (!userId) {
      showToast("Sign in to update your password", { type: "info" });
      return;
    }

    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      showToast("Password must be at least 6 characters", { type: "warning" });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast("Passwords do not match", { type: "warning" });
      return;
    }

    setIsSavingPassword(true);
    try {
      await authService.changePassword({
        userId,
        newPassword: passwordForm.newPassword,
      });
      showToast("Password updated", { type: "success" });
      setPasswordForm({ newPassword: "", confirmPassword: "" });
    } catch (error) {
      showToast(error.message || "Unable to update password", {
        type: "error",
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (!user || isGuest) {
    return null;
  }

  return (
    <div className="account-page">
      <NavBar user={user} onLogout={onLogout} />
      <main className="account-main">
        <div className="account-grid">
          <aside className="account-sidebar" aria-label="Account menu">
            <div className="account-profile">
              <div className="account-avatar" aria-hidden="true">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" />
                ) : (
                  <span>{avatarInitials}</span>
                )}
              </div>
              <div>
                <p className="account-name">{displayName}</p>
                <p className="account-email">{user?.email}</p>
              </div>
            </div>
            <nav className="account-nav">
              <button
                type="button"
                className={`account-nav-item${
                  activeSection === "profile" ? " active" : ""
                }`}
                onClick={() => setActiveSection("profile")}
              >
                Overview
              </button>
              <button
                type="button"
                className={`account-nav-item${
                  activeSection === "addresses" ? " active" : ""
                }`}
                onClick={() => setActiveSection("addresses")}
              >
                Your addresses
              </button>
              <button
                type="button"
                className={`account-nav-item${
                  activeSection === "security" ? " active" : ""
                }`}
                onClick={() => setActiveSection("security")}
              >
                Change password
              </button>
              <button
                type="button"
                className={`account-nav-item with-icon${
                  activeSection === "support" ? " active" : ""
                }`}
                onClick={() => setActiveSection("support")}
              >
                <span className="account-nav-icon" aria-hidden="true">
                  <IconHeadphones size={18} />
                </span>
                Contact support
              </button>
            </nav>
          </aside>
          <section className="account-content">
            {activeSection === "profile" && (
              <div className="account-panel">
                <h2>Account overview</h2>
                <p className="account-subtext">
                  Manage your Cartify profile, addresses, and security settings
                  from here.
                </p>
                <div className="account-summary">
                  <div>
                    <h3>Profile details</h3>
                    <p>{displayName}</p>
                    {user?.phoneNumber && <p>{user.phoneNumber}</p>}
                  </div>
                  <div>
                    <h3>Signed in with</h3>
                    <p>{user?.email}</p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "addresses" && (
              <div className="account-panel">
                <div className="panel-header">
                  <h2>Saved addresses</h2>
                  <button
                    type="button"
                    className="panel-refresh"
                    onClick={loadAddresses}
                  >
                    Refresh
                  </button>
                </div>
                {addressesLoading && (
                  <p className="muted">Loading addresses...</p>
                )}
                {addressesError && (
                  <p className="error" role="alert">
                    {addressesError}
                  </p>
                )}
                {!addressesLoading && !addresses.length && !addressesError && (
                  <p className="muted">
                    You have not saved any addresses yet. Add one during
                    checkout to see it here.
                  </p>
                )}
                <div className="address-list">
                  {addresses.map((address) => {
                    const addressId = resolveAddressId(address);
                    const lines = buildAddressLines(address);
                    const badges = [];
                    if (address.tag) {
                      badges.push(
                        address.tag.charAt(0).toUpperCase() +
                          address.tag.slice(1)
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
                      <article key={addressId} className="address-card">
                        <header className="address-card-header">
                          <div>
                            <h3>{address.label || "Saved address"}</h3>
                            <div className="badge-row">
                              {badges.map((badge) => (
                                <span key={badge} className="badge">
                                  {badge}
                                </span>
                              ))}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="delete-button"
                            onClick={() => handleDeleteAddress(addressId)}
                            aria-label="Delete address"
                          >
                            Remove
                          </button>
                        </header>
                        <div className="address-lines">
                          {lines.map((line, index) => (
                            <p key={index}>{line}</p>
                          ))}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}

            {activeSection === "security" && (
              <div className="account-panel">
                <h2>Change password</h2>
                <p className="account-subtext">
                  Choose a strong password with at least 6 characters.
                </p>
                <form className="password-form" onSubmit={handlePasswordSubmit}>
                  <label>
                    <span>New password</span>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(event) =>
                        handlePasswordFieldChange(
                          "newPassword",
                          event.target.value
                        )
                      }
                      minLength={6}
                      required
                    />
                  </label>
                  <label>
                    <span>Confirm password</span>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(event) =>
                        handlePasswordFieldChange(
                          "confirmPassword",
                          event.target.value
                        )
                      }
                      minLength={6}
                      required
                    />
                  </label>
                  <button type="submit" disabled={isSavingPassword}>
                    {isSavingPassword ? "Saving..." : "Update password"}
                  </button>
                </form>
              </div>
            )}

            {activeSection === "support" && (
              <div className="account-panel">
                <h2>Contact support</h2>
                <p className="account-subtext">
                  Reach the Cartify team through any of the channels below.
                </p>
                <div className="contact-grid">
                  <article className="contact-card">
                    <div className="contact-header">
                      <span className="contact-icon" aria-hidden="true">
                        <IconMail size={20} />
                      </span>
                      <h3>Email support</h3>
                    </div>
                    <p>connect@cartify.help</p>
                    <p>Priority responses within 24 hours.</p>
                  </article>
                  <article className="contact-card">
                    <div className="contact-header">
                      <span className="contact-icon" aria-hidden="true">
                        <IconPhone size={20} />
                      </span>
                      <h3>Call us</h3>
                    </div>
                    <ul className="contact-list">
                      <li>+91 44 1234 5678</li>
                      <li>+91 80 2233 4455</li>
                      <li>+91 22 7788 9900</li>
                    </ul>
                    <p>Weekdays 9 AM to 8 PM IST.</p>
                  </article>
                  <article className="contact-card">
                    <div className="contact-header">
                      <span className="contact-icon" aria-hidden="true">
                        <IconWhatsapp size={20} />
                      </span>
                      <h3>WhatsApp</h3>
                    </div>
                    <p>Message us at +91 90030 12345.</p>
                    <p>Instant help for order and delivery queries.</p>
                  </article>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Account;
