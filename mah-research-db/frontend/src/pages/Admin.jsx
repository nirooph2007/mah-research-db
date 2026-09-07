import React, { useEffect, useState } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

const ROLES = ["author", "reviewer", "admin", "superadmin"];

export default function Admin() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [view, setView] = useState([]);
  const [tab, setTab] = useState("users");

  const loadUsers = () => client.get("/users").then((r) => setUsers(r.data));
  const loadView = () => client.get("/reports/published-view").then((r) => setView(r.data));

  useEffect(() => { loadUsers(); loadView(); }, []);

  const changeRole = async (id, role) => {
    await client.put(`/users/${id}/role`, { role });
    loadUsers();
  };

  const deleteUser = async (id) => {
    if (!confirm("Delete this user?")) return;
    await client.delete(`/users/${id}`);
    loadUsers();
  };

  return (
    <div className="shell page">
      <h1 style={{ fontSize: 26, marginBottom: 4 }}>Admin</h1>
      <p className="muted" style={{ marginBottom: 24 }}>Logged in as {user.name} ({user.role})</p>

      <div style={{ marginBottom: 20 }}>
        <button className="btn secondary" style={{ marginRight: 8 }} onClick={() => setTab("users")}>User management (DCL)</button>
        <button className="btn secondary" onClick={() => setTab("view")}>Published papers (DB view)</button>
      </div>

      {tab === "users" && (
        <div className="card">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Affiliation</th><th></th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    {user.role === "superadmin" ? (
                      <select value={u.role} onChange={(e) => changeRole(u._id, e.target.value)}>
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    ) : u.role}
                  </td>
                  <td>{u.affiliation}</td>
                  <td><button className="btn danger" onClick={() => deleteUser(u._id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "view" && (
        <div className="card">
          <p className="muted" style={{ marginBottom: 12 }}>
            Reading directly from the MongoDB view <code>published_papers_view</code> (run <code>npm run views:create</code> on the backend first).
          </p>
          <table>
            <thead><tr><th>Title</th><th>Journal</th><th>Author</th><th>DOI</th><th>Score</th></tr></thead>
            <tbody>
              {view.map((v) => (
                <tr key={v._id}>
                  <td>{v.title}</td>
                  <td>{v.journal?.shortCode}</td>
                  <td>{v.author?.name}</td>
                  <td>{v.doi}</td>
                  <td>{v.avgReviewScore ?? "—"}</td>
                </tr>
              ))}
              {view.length === 0 && <tr><td colSpan={5} className="muted">View is empty — publish a paper first, or create the view.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
