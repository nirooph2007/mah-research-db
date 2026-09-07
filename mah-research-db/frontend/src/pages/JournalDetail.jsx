import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function JournalDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const canManage = user && ["admin", "superadmin"].includes(user.role);

  const load = () => client.get(`/journals/${id}/full`).then((r) => setData(r.data)).catch(() => setError("Journal not found"));
  useEffect(() => { load(); }, [id]);

  const deleteJournal = async () => {
    if (!confirm("Delete this journal?")) return;
    await client.delete(`/journals/${id}`);
    window.location.href = "/journals";
  };

  if (error) return <div className="shell page">{error}</div>;
  if (!data) return <div className="shell page">Loading...</div>;

  return (
    <div className="shell page">
      <Link to="/journals" className="muted">← Back to journals</Link>
      <div className="section-head" style={{ marginTop: 12 }}>
        <div>
          <span className="tag">{data.shortCode}</span>
          <h1 style={{ fontSize: 26, marginTop: 6 }}>{data.title}</h1>
          <p className="muted">{data.field} · {data.frequency} · ISSN {data.issn}</p>
        </div>
        {canManage && <button className="btn danger" onClick={deleteJournal}>Delete journal</button>}
      </div>

      <div className="grid cols-2" style={{ marginTop: 28 }}>
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Editorial board ({data.boardUsers?.length || 0})</h2>
          <div className="card">
            {(data.board || []).map((b) => {
              const u = (data.boardUsers || []).find((x) => x._id === b.userId?.toString?.() || x._id === b.userId);
              return (
                <div key={b._id} className="list-item">
                  <strong>{u?.name || "Member"}</strong> — {b.boardRole}
                </div>
              );
            })}
            {(!data.board || data.board.length === 0) && <p className="muted">No editorial board assigned yet.</p>}
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Papers ({data.papers?.length || 0})</h2>
          <div className="card">
            {(data.papers || []).map((p) => (
              <div key={p._id} className="list-item">
                <Link to={`/papers/${p._id}`}><strong>{p.title}</strong></Link>
                <div style={{ marginTop: 4 }}><span className={`pill ${p.status}`}>{p.status}</span></div>
              </div>
            ))}
            {(!data.papers || data.papers.length === 0) && <p className="muted">No papers submitted yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
