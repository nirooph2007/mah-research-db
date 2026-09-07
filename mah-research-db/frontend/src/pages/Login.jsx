import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shell page" style={{ maxWidth: 420 }}>
      <h1 style={{ fontSize: 26, marginBottom: 20 }}>Log in</h1>
      <form className="card" onSubmit={submit}>
        <label>Email</label>
        <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <label>Password</label>
        <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <div className="error">{error}</div>}
        <button className="btn" style={{ marginTop: 20, width: "100%" }} disabled={loading}>
          {loading ? "Signing in..." : "Log in"}
        </button>
      </form>
      <p className="muted" style={{ marginTop: 14 }}>
        No account? <Link to="/register">Register as an author</Link>
      </p>
      <p className="muted" style={{ marginTop: 6, fontSize: 12 }}>
        Seeded demo login: admin1@mah.tech / Password@123
      </p>
    </div>
  );
}
