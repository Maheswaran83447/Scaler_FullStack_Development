import { useState } from "react";
import { Link } from "react-router-dom";
import CartifyLogo from "../components/CartifyLogo";

const initialFormState = {
  email: "",
  username: "",
  phoneNumber: "",
  password: "",
  confirmPassword: "",
};

const SignUp = ({ onRegister, isLoading, authError }) => {
  const [formData, setFormData] = useState(initialFormState);
  const [formError, setFormError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    if (formData.password !== formData.confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    try {
      await onRegister({
        email: formData.email,
        username: formData.username,
        password: formData.password,
        phoneNumber: formData.phoneNumber || undefined,
      });
    } catch (error) {
      setFormError(error.message || "Registration failed");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <CartifyLogo />
        </div>
        <h1 className="auth-title">Create your Cartify account</h1>
        <p className="auth-subtitle">
          Shop smarter by keeping your orders and cart in sync.
        </p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className="auth-input"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              className="auth-input"
              placeholder="Choose a username"
              value={formData.username}
              onChange={handleChange}
              required
              minLength={3}
              disabled={isLoading}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="phoneNumber">
              Phone number (optional)
            </label>
            <input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              className="auth-input"
              placeholder="+1 555 123 4567"
              value={formData.phoneNumber}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="auth-input"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              disabled={isLoading}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="confirmPassword">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className="auth-input"
              placeholder="Repeat your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
              disabled={isLoading}
            />
          </div>

          {(formError || authError) && (
            <p className="form-error" role="alert">
              {formError || authError}
            </p>
          )}

          <button type="submit" className="auth-submit" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="auth-footer">
          Already registered? <Link to="/">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
