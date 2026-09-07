import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Journals() {
  const { user } = useAuth();
  const [journals, setJournals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", shortCode: "", field: "", frequency: "Quarterly" });
  const [error, setError] = useState("");

  const load = () => client.get("/journals").then((r) => setJournals(r.data));
  useEffect(() => { load(); }, []);

  const canManage = user && ["admin", "superadmin"].includes(user.role);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await client.post("/journals", form);
      setForm({ title: "", shortCode: "", field: "", frequency: "Quarterly" });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create journal");
    }
  };

  return (
    <div className="shell page">
      <div className="section-head">
        <h1 style={{ fontSize: 26 }}>Journals</h1>
        {canManage && (
          <button className="btn" onClick={() => setShowForm((s) => !s)}>
            {showForm ? "Cancel" : "+ New journal"}
          </button>
        )}
      </div>

      {showForm && (
        <form className="card" onSubmit={submit} style={{ marginBottom: 24 }}>
          <div className="grid cols-2">
            <div><label>Title</label><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><label>Short code</label><input required value={form.shortCode} onChange={(e) => setForm({ ...form, shortCode: e.target.value })} /></div>
            <div><label>Field</label><input required value={form.field} onChange={(e) => setForm({ ...form, field: e.target.value })} /></div>
            <div>
              <label>Frequency</label>
              <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
                <option>Monthly</option><option>Quarterly</option><option>Biannual</option><option>Annual</option>
              </select>
            </div>
          </div>
          {error && <div className="error">{error}</div>}
          <button className="btn" style={{ marginTop: 16 }}>Create journal</button>
        </form>
      )}

      <div className="grid cols-2">
        {journals.map((j) => (
          <Link key={j._id} to={`/journals/${j._id}`} className="card" style={{ display: "block" }}>
            <span className="tag">{j.shortCode}</span>
            <h3 style={{ fontSize: 18, marginTop: 8 }}>{j.title}</h3>
            <p className="muted" style={{ marginTop: 6 }}>{j.field} · {j.frequency}</p>
            <p className="muted" style={{ marginTop: 4 }}>ISSN: {j.issn}</p>
          </Link>
        ))}
        {journals.length === 0 && <p className="muted">No journals yet.</p>}
      </div>
    </div>
  );
}
