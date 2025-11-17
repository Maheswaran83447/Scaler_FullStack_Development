import { useCallback, useContext, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  Link,
} from "react-router-dom";
import { CartContext, CartProvider } from "./context/CartContext";
import { ToastProvider } from "./context/ToastContext";
import "./App.css";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import PlaceOrder from "./pages/PlaceOrder";
import useAuth from "./hooks/useAuth";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import OrderHistory from "./pages/OrderHistory";
import { ToastContext } from "./context/ToastContext";
import authService from "./services/authService";
import CartifyLogo from "./components/CartifyLogo";
import { WishlistContext, WishlistProvider } from "./context/WishlistContext";
import Wishlist from "./pages/Wishlist";
import Account from "./pages/Account";

function LoginPane({ onGuest, onLogin, isLoading, authError }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    try {
      await onLogin({ identifier, password });
    } catch (error) {
      setFormError(error.message || "Login failed");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" role="dialog" aria-label="Sign in">
        <div className="auth-logo">
          <CartifyLogo />
        </div>
        <h1 className="auth-title">Sign in to Cartify</h1>
        <p className="auth-subtitle">
          Welcome back! Enter your credentials to continue.
        </p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label className="auth-label" htmlFor="identifier">
              Email or phone number
            </label>
            <input
              id="identifier"
              type="text"
              placeholder="you@example.com"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
              className="auth-input"
              disabled={isLoading}
              autoComplete="username"
            />
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="auth-input"
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>
          {(formError || authError) && (
            <p className="form-error" role="alert">
              {formError || authError}
            </p>
          )}
          <button type="submit" className="auth-submit" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
          <div className="auth-secondary-links">
            <Link to="/forgot-password" className="auth-link">
              Forgot your password?
            </Link>
          </div>
        </form>
        <div className="auth-divider">
          <span>or</span>
        </div>
        <button className="auth-secondary" onClick={onGuest} type="button">
          Explore as guest
        </button>
        <p className="auth-footer">
          New to Cartify? <Link to="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
}

function AppRoutesWrapper() {
  const auth = useAuth();
  return (
    <WishlistProvider user={auth.user}>
      <AppRoutesInner auth={auth} />
    </WishlistProvider>
  );
}

function AppRoutesInner({ auth }) {
  const navigate = useNavigate();
  const { showToast } = useContext(ToastContext);
  const { clearCart } = useContext(CartContext);
  const { clearWishlist } = useContext(WishlistContext);
  const [auxLoading, setAuxLoading] = useState(false);

  const { user, loginAsGuest, logout, register, login, loading, error } = auth;

  const hasAccountSession = Boolean(user && !user.isGuest);

  const resetClientState = useCallback(() => {
    clearCart();
    clearWishlist();
  }, [clearCart, clearWishlist]);

  const handleGuest = useCallback(() => {
    if (hasAccountSession) {
      resetClientState();
    }
    loginAsGuest();
    navigate("/home");
  }, [hasAccountSession, resetClientState, loginAsGuest, navigate]);

  const handleLogin = useCallback(
    async (credentials) => {
      try {
        await login(credentials);
        showToast("Signed in successfully", { type: "success" });
        navigate("/home");
      } catch (err) {
        showToast(err.message || "Login failed", { type: "error" });
        throw err;
      }
    },
    [login, navigate, showToast]
  );

  const handleRegister = useCallback(
    async (payload) => {
      try {
        resetClientState();
        await register(payload);
        showToast("Account created", { type: "success" });
        navigate("/home");
      } catch (err) {
        showToast(err.message || "Registration failed", { type: "error" });
        throw err;
      }
    },
    [navigate, register, resetClientState, showToast]
  );

  const handleLogout = useCallback(() => {
    logout();
    resetClientState();
    navigate("/home", { replace: true });
    showToast("Signed out", { type: "info" });
  }, [logout, navigate, resetClientState, showToast]);

  const handleForgotPassword = useCallback(
    async (identifier) => {
      setAuxLoading(true);
      try {
        const response = await authService.requestPasswordReset({ identifier });
        showToast(response?.message || "Reset link sent to your email", {
          type: "success",
        });
        return response;
      } catch (err) {
        showToast(err.message || "Unable to send reset email", {
          type: "error",
        });
        throw err;
      } finally {
        setAuxLoading(false);
      }
    },
    [showToast]
  );

  const handleResetPassword = useCallback(
    async ({ token, password }) => {
      setAuxLoading(true);
      try {
        const response = await authService.resetPassword({ token, password });
        showToast(
          response?.message || "Password updated. You can sign in now.",
          {
            type: "success",
          }
        );
        navigate("/");
        return response;
      } catch (err) {
        showToast(err.message || "Unable to reset password", {
          type: "error",
        });
        throw err;
      } finally {
        setAuxLoading(false);
      }
    },
    [navigate, showToast]
  );

  return (
    <Routes>
      <Route
        path="/"
        element={
          <LoginPane
            onGuest={handleGuest}
            onLogin={handleLogin}
            isLoading={loading}
            authError={error}
          />
        }
      />
      <Route
        path="/signup"
        element={
          <SignUp
            onRegister={handleRegister}
            isLoading={loading}
            authError={error}
          />
        }
      />
      <Route
        path="/forgot-password"
        element={
          <ForgotPassword
            onRequestReset={handleForgotPassword}
            isLoading={loading || auxLoading}
            authError={null}
          />
        }
      />
      <Route
        path="/reset-password"
        element={
          <ResetPassword
            onResetPassword={handleResetPassword}
            isLoading={loading || auxLoading}
            authError={null}
          />
        }
      />
      <Route
        path="/home"
        element={<Home user={user} onLogout={handleLogout} />}
      />
      <Route
        path="/products"
        element={<Products user={user} onLogout={handleLogout} />}
      />
      <Route
        path="/products/:id"
        element={<ProductDetails user={user} onLogout={handleLogout} />}
      />
      <Route
        path="/wishlist"
        element={<Wishlist user={user} onLogout={handleLogout} />}
      />
      <Route
        path="/account"
        element={<Account user={user} onLogout={handleLogout} />}
      />
      <Route
        path="/checkout"
        element={<PlaceOrder user={user} onLogout={handleLogout} />}
      />
      <Route
        path="/cart"
        element={<Cart user={user} onLogout={handleLogout} />}
      />
      <Route
        path="/orders"
        element={<OrderHistory user={user} onLogout={handleLogout} />}
      />
      <Route path="*" element={<Home user={user} onLogout={handleLogout} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <CartProvider>
          <AppRoutesWrapper />
        </CartProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
