import { useState } from "react";
import axios from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import useAuth from "../context/useAuth";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post("/api/auth/login", { username, password });

      alert("Login successful");
      localStorage.setItem("token", res.data.token);
      login({ username: res.data.username });
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <h3>Login</h3>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <br />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br />

      <button type="submit">Login</button>

      <p>
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </form>
  );
}

export default Login;
