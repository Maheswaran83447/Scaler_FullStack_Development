import { useState } from "react";
import { Link } from "react-router-dom";
import CartifyLogo from "../components/CartifyLogo";

const ForgotPassword = ({ onRequestReset, isLoading, authError }) => {
  const [identifier, setIdentifier] = useState("");
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus(null);
    setError(null);
    try {
      const response = await onRequestReset(identifier.trim());
      if (response?.message) {
        setStatus(response.message);
      } else {
        setStatus(
          "If an account exists for this email or phone, we just sent reset instructions."
        );
      }
    } catch (err) {
      setError(err.message || "Unable to process request");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <CartifyLogo />
        </div>
        <h1 className="auth-title">Forgot your password?</h1>
        <p className="auth-subtitle">
          Enter the email address or phone number linked to your Cartify
          account. We&apos;ll send a reset link to your inbox.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="forgot-identifier">
              Email or phone number
            </label>
            <input
              id="forgot-identifier"
              type="text"
              className="auth-input"
              placeholder="you@example.com"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          {status && (
            <p className="form-success" role="status">
              {status}
            </p>
          )}
          {(error || authError) && !status && (
            <p className="form-error" role="alert">
              {error || authError}
            </p>
          )}

          <button type="submit" className="auth-submit" disabled={isLoading}>
            {isLoading ? "Sending reset link..." : "Send reset link"}
          </button>
        </form>

        <p className="auth-footer">
          Remembered it? <Link to="/">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
