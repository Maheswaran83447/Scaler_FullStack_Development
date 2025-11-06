import { useState } from "react";
import Lottie from "lottie-react";
import animationData from "./assets/Landing Page - Animation.json";
import "./App.css";

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Submitted: ${username}`);
  };

  return (
    <div className="landing-container">
      <Lottie
        animationData={animationData}
        loop={true}
        autoplay={true}
        className="lottie-bg"
      />
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
      </div>
    </div>
  );
}

export default App;
