import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Papers() {
  const { user } = useAuth();
  const [papers, setPapers] = useState([]);
  const [journals, setJournals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", abstract: "", journalId: "", keywords: "" });
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

  const load = () => client.get("/papers", { params: filter ? { status: filter } : {} }).then((r) => setPapers(r.data));
  useEffect(() => { load(); }, [filter]);
  useEffect(() => { client.get("/journals").then((r) => setJournals(r.data)); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await client.post("/papers", { ...form, keywords: form.keywords.split(",").map((k) => k.trim()).filter(Boolean) });
      setForm({ title: "", abstract: "", journalId: "", keywords: "" });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Submission failed (transaction rolled back)");
    }
  };

  return (
    <div className="shell page">
      <div className="section-head">
        <h1 style={{ fontSize: 26 }}>Papers</h1>
        {user && (
          <button className="btn" onClick={() => setShowForm((s) => !s)}>
            {showForm ? "Cancel" : "+ Submit paper"}
          </button>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        {["", "submitted", "under_review", "accepted", "published", "rejected"].map((s) => (
          <button key={s} className="btn secondary" style={{ marginRight: 8, marginBottom: 8 }} onClick={() => setFilter(s)}>
            {s || "All"}
          </button>
        ))}
      </div>

      {showForm && (
        <form className="card" onSubmit={submit} style={{ marginBottom: 24 }}>
          <label>Title</label>
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <label>Journal</label>
          <select required value={form.journalId} onChange={(e) => setForm({ ...form, journalId: e.target.value })}>
            <option value="">Select a journal...</option>
            {journals.map((j) => <option key={j._id} value={j._id}>{j.title} ({j.shortCode})</option>)}
          </select>
          <label>Abstract</label>
          <textarea required value={form.abstract} onChange={(e) => setForm({ ...form, abstract: e.target.value })} />
          <label>Keywords (comma separated)</label>
          <input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} />
          {error && <div className="error">{error}</div>}
          <button className="btn" style={{ marginTop: 16 }}>Submit paper</button>
        </form>
      )}

      <div className="card">
        <table>
          <thead><tr><th>Title</th><th>Journal</th><th>Author</th><th>Status</th><th>Avg. score</th></tr></thead>
          <tbody>
            {papers.map((p) => (
              <tr key={p._id}>
                <td><Link to={`/papers/${p._id}`}>{p.title}</Link></td>
                <td>{p.journalId?.shortCode}</td>
                <td>{p.authorId?.name}</td>
                <td><span className={`pill ${p.status}`}>{p.status}</span></td>
                <td>{p.avgReviewScore ?? "—"}</td>
              </tr>
            ))}
            {papers.length === 0 && <tr><td colSpan={5} className="muted">No papers found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
