import React from "react";
import { Link } from "react-router-dom";
import "./nav.css";

const NavBar = ({ user, onLogout }) => {
  return (
    <nav className="site-nav">
      <div className="nav-left">
        <Link to="/home" className="brand">
          MyStore
        </Link>
      </div>
      <div className="nav-right">
        <Link to="/products" className="nav-link">
          Products
        </Link>
        <Link to="/cart" className="nav-link">
          Cart
        </Link>
        {user ? (
          <button className="nav-logout" onClick={onLogout}>
            Logout
          </button>
        ) : (
          <Link to="/" className="nav-link">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
