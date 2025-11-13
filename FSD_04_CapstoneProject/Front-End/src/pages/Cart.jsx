import React from "react";
import NavBar from "../components/NavBar";

const Cart = ({ user, onLogout }) => {
  return (
    <div>
      <NavBar user={user} onLogout={onLogout} />
      <main style={{ padding: "2rem" }}>
        <h2>Your Cart</h2>
        <p>This is a mock cart. Add real cart logic later.</p>
      </main>
    </div>
  );
};

export default Cart;
