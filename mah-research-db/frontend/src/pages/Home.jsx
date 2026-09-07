import React, { useEffect, useState } from "react";
import client from "../api/client";
import { Link } from "react-router-dom";

export default function Home() {
  const [summary, setSummary] = useState(null);
  const [byJournal, setByJournal] = useState([]);

  useEffect(() => {
    client.get("/reports/summary").then((r) => setSummary(r.data));
    client.get("/reports/papers-per-journal").then((r) => setByJournal(r.data));
  }, []);

  return (
    <div className="shell page">
      <h1 style={{ fontSize: 30, marginBottom: 6 }}>MAH Research Journal Portal</h1>
      <p className="muted" style={{ marginBottom: 32 }}>
        A peer-reviewed publishing platform, built on MongoDB with schema validation,
        transactions, triggers, cursors, aggregation pipelines and views.
      </p>

      {summary && (
        <div className="grid cols-4" style={{ marginBottom: 36 }}>
          <div className="card stat"><div className="num">{summary.totalUsers}</div><div className="label">Users</div></div>
          <div className="card stat"><div className="num">{summary.totalJournals}</div><div className="label">Journals</div></div>
          <div className="card stat"><div className="num">{summary.totalPapers}</div><div className="label">Papers</div></div>
          <div className="card stat"><div className="num">{summary.published}</div><div className="label">Published</div></div>
        </div>
      )}

      <div className="section-head">
        <h2 style={{ fontSize: 20 }}>Papers per journal (aggregate report)</h2>
        <Link to="/journals">View journals →</Link>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr><th>Journal</th><th>Papers</th><th>Published</th><th>Avg. review score</th></tr>
          </thead>
          <tbody>
            {byJournal.map((j) => (
              <tr key={j.shortCode}>
                <td>{j.journalTitle} ({j.shortCode})</td>
                <td>{j.paperCount}</td>
                <td>{j.published}</td>
                <td>{j.avgScore || "—"}</td>
              </tr>
            ))}
            {byJournal.length === 0 && <tr><td colSpan={4} className="muted">No data yet — run the seed script.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
