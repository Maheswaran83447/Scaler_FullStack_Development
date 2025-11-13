import React from "react";
import NavBar from "../components/NavBar";
import { Link } from "react-router-dom";
import products from "../mock/mockData";

const Products = ({ user, onLogout }) => {
  return (
    <div>
      <NavBar user={user} onLogout={onLogout} />
      <main style={{ padding: "2rem" }}>
        <h2>Products</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
          }}
        >
          {products.map((p) => (
            <div
              key={p.id}
              style={{
                border: "1px solid #ddd",
                padding: "1rem",
                borderRadius: 6,
              }}
            >
              <h3>{p.title}</h3>
              <p>{p.description}</p>
              <p>
                <strong>${p.price}</strong>
              </p>
              <Link to={`/products/${p.id}`}>View</Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Products;
