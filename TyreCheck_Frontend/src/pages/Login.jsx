import { useState } from "react";
import "./Login.css";
import TyreImage from "../assets/tyre.png";
import Logo from "../assets/Logo.png";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const response = await fetch("http://127.0.0.1:8000/auth/user/user_login", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        username: username,
        password: password,
      }),
    });

    if (!response.ok) {
      alert("Invalid username or password");
      return;
    }

    const data = await response.json();
    console.log("Login Response:", data);

    localStorage.setItem("access_token", data.access_token);
    navigate("/dashboard");

  } catch (error) {
    console.error(error);
    alert("Login failed");
  }
};

  return (
    <div className="login-wrapper">
      <div className="login-card">
        {/* Left Section */}
        <div className="left-section">
          <img src={Logo} alt="Logo" className="login-logo" />
          <h2 className="title">Tyre Check</h2>

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Username"
              className="input-box"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password"
              className="input-box"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button type="submit" className="btn-login">
              Sign In
            </button>
          </form>
        </div>

        {/* Right Section */}
        <div className="right-section">
          <img src={TyreImage} className="hero-img" alt="Login Illustration" />
        </div>
      </div>
    </div>
  );
}
