import { useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import animationData from "./assets/Landing Page - Animation.json";
import "./App.css";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import useAuth from "./hooks/useAuth";

function LoginPane({ onGuest }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // real login requires backend; keep simple for now
    alert(`Submitted: ${username}`);
  };

  return (
    <div className="landing-container">
      <div className="animation-section">
        <Lottie
          animationData={animationData}
          loop={true}
          autoplay={true}
          className="lottie-animation"
        />
      </div>

      <div className="divider"></div>

      <div className="login-section">
        <div className="login-box" role="dialog" aria-label="Login">
          <form onSubmit={handleSubmit} className="login-form">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="login-input"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="login-input"
            />
            <button type="submit" className="login-button">
              Sign in
            </button>
          </form>

          <div className="signup-link">
            New user? <a href="/signup">Sign up</a>
          </div>

          <div className="divider-section">
            <div className="divider-line"></div>
            <span className="divider-text">or</span>
            <div className="divider-line"></div>
          </div>

          <div className="social-login">
            <button
              type="button"
              className="social-icon"
              title="Login with Google"
              onClick={() => console.log("Google login")}
            >
              🔵
            </button>
            <button
              type="button"
              className="social-icon"
              title="Login with Facebook"
              onClick={() => console.log("Facebook login")}
            >
              📘
            </button>
          </div>

          <div style={{ marginTop: 12 }}>
            <button className="guest-button" onClick={onGuest}>
              Explore as guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppRoutesWrapper() {
  const { user, loginAsGuest, logout } = useAuth();
  const navigate = useNavigate();

  const handleGuest = () => {
    loginAsGuest();
    navigate("/home");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <Routes>
      <Route path="/" element={<LoginPane onGuest={handleGuest} />} />
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
        path="/cart"
        element={<Cart user={user} onLogout={handleLogout} />}
      />
      {/* fallback to home */}
      <Route path="*" element={<Home user={user} onLogout={handleLogout} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutesWrapper />
    </BrowserRouter>
  );
}
