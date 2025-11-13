import React from "react";
import NavBar from "../components/NavBar";

const Home = ({ user, onLogout }) => {
  return (
    <div>
      <NavBar user={user} onLogout={onLogout} />
      <main style={{ padding: "2rem" }}>
        <h1>Welcome{user ? `, ${user.name}` : ""}!</h1>
        <p>
          This is a mock Home page rendered without a database. Use the
          navigation to explore products and cart.
        </p>
      </main>
    </div>
  );
};

export default Home;
