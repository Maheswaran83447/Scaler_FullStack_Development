import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import CartifyLogo from "../components/CartifyLogo";

const ResetPassword = ({ onResetPassword, isLoading, authError }) => {
  const location = useLocation();
  const token = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("token") || "";
  }, [location.search]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError("Reset link is missing or invalid.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      await onResetPassword({ token, password });
    } catch (err) {
      setError(err.message || "Unable to reset password");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <CartifyLogo />
        </div>
        <h1 className="auth-title">Choose a new password</h1>
        <p className="auth-subtitle">
          Enter and confirm a new password for your Cartify account.
        </p>

        {!token && (
          <p className="form-error" role="alert">
            This reset link is missing a token. Request a new one from the
            forgot password page.
          </p>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="new-password">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              className="auth-input"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              disabled={isLoading || !token}
              autoComplete="new-password"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="confirm-password">
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              className="auth-input"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={6}
              disabled={isLoading || !token}
              autoComplete="new-password"
            />
          </div>

          {(error || authError) && (
            <p className="form-error" role="alert">
              {error || authError}
            </p>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={isLoading || !token}
          >
            {isLoading ? "Saving..." : "Update password"}
          </button>
        </form>

        <p className="auth-footer">
          Need to start over?{" "}
          <Link to="/forgot-password">Request a new link</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
