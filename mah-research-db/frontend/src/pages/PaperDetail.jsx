import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

const STATUSES = ["submitted", "under_review", "accepted", "rejected", "published"];

export default function PaperDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [paper, setPaper] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ score: 8, comments: "", recommendation: "accept" });
  const [error, setError] = useState("");

  const load = () => {
    client.get(`/papers/${id}`).then((r) => setPaper(r.data));
    client.get(`/reviews/paper/${id}`).then((r) => setReviews(r.data));
  };
  useEffect(() => { load(); }, [id]);

  const canReview = user && ["reviewer", "admin", "superadmin"].includes(user.role);
  const canManageStatus = user && ["admin", "superadmin"].includes(user.role);

  const changeStatus = async (status) => {
    await client.put(`/papers/${id}/status`, { status });
    load();
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await client.post("/reviews", { paperId: id, ...reviewForm, score: Number(reviewForm.score) });
      setReviewForm({ score: 8, comments: "", recommendation: "accept" });
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Review failed");
    }
  };

  if (!paper) return <div className="shell page">Loading...</div>;

  return (
    <div className="shell page">
      <Link to="/papers" className="muted">← Back to papers</Link>
      <div className="section-head" style={{ marginTop: 12 }}>
        <div>
          <h1 style={{ fontSize: 24 }}>{paper.title}</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            {paper.journalId?.title} · by {paper.authorId?.name}
          </p>
        </div>
        <span className={`pill ${paper.status}`}>{paper.status}</span>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <p>{paper.abstract}</p>
        {paper.keywords?.length > 0 && (
          <div style={{ marginTop: 12 }}>
            {paper.keywords.map((k) => <span key={k} className="tag">{k}</span>)}
          </div>
        )}
        {paper.avgReviewScore != null && <p className="muted" style={{ marginTop: 12 }}>Average review score: {paper.avgReviewScore}/10</p>}
        {paper.doi && <p className="muted">DOI: {paper.doi}</p>}
      </div>

      {canManageStatus && (
        <div style={{ marginTop: 20 }}>
          <label>Change status (updating to "published" fires TRIGGER #1)</label>
          <div>
            {STATUSES.map((s) => (
              <button key={s} className="btn secondary" style={{ marginRight: 8, marginTop: 8 }} onClick={() => changeStatus(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>Reviews ({reviews.length})</h2>
      <div className="card">
        {reviews.map((r) => (
          <div key={r._id} className="list-item">
            <strong>{r.reviewerId?.name}</strong> — {r.score}/10 — <span className="tag">{r.recommendation}</span>
            <p className="muted" style={{ marginTop: 4 }}>{r.comments}</p>
          </div>
        ))}
        {reviews.length === 0 && <p className="muted">No reviews yet.</p>}
      </div>

      {canReview && (
        <form className="card" onSubmit={submitReview} style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 16, marginBottom: 4 }}>Add review (fires TRIGGER #2)</h3>
          <label>Score (1-10)</label>
          <input type="number" min={1} max={10} value={reviewForm.score} onChange={(e) => setReviewForm({ ...reviewForm, score: e.target.value })} />
          <label>Recommendation</label>
          <select value={reviewForm.recommendation} onChange={(e) => setReviewForm({ ...reviewForm, recommendation: e.target.value })}>
            <option value="accept">accept</option>
            <option value="minor_revision">minor_revision</option>
            <option value="major_revision">major_revision</option>
            <option value="reject">reject</option>
          </select>
          <label>Comments</label>
          <textarea value={reviewForm.comments} onChange={(e) => setReviewForm({ ...reviewForm, comments: e.target.value })} />
          {error && <div className="error">{error}</div>}
          <button className="btn" style={{ marginTop: 16 }}>Submit review</button>
        </form>
      )}
    </div>
  );
}
