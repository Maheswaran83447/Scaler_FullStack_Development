import React from "react";
import { useParams } from "react-router-dom";
import NavBar from "../components/NavBar";
import products from "../mock/mockData";

const ProductDetails = ({ user, onLogout }) => {
  const { id } = useParams();
  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <div>
        <NavBar user={user} onLogout={onLogout} />
        <main style={{ padding: "2rem" }}>
          <p>Product not found.</p>
        </main>
      </div>
    );
  }

  return (
    <div>
      <NavBar user={user} onLogout={onLogout} />
      <main style={{ padding: "2rem" }}>
        <h2>{product.title}</h2>
        <p>{product.description}</p>
        <p>
          <strong>${product.price}</strong>
        </p>
      </main>
    </div>
  );
};

export default ProductDetails;
