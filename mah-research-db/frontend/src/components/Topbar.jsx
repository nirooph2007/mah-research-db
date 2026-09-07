import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="topbar">
      <div className="topbar-inner">
        <NavLink to="/" className="brand">
          <span className="brand-title">MAH Research Portal</span>
          <span className="brand-sub">Journals · Papers · Peer Review</span>
        </NavLink>
        <div className="nav">
          <NavLink to="/journals" className={({ isActive }) => (isActive ? "active" : "")}>Journals</NavLink>
          <NavLink to="/papers" className={({ isActive }) => (isActive ? "active" : "")}>Papers</NavLink>
          {user && ["admin", "superadmin"].includes(user.role) && (
            <NavLink to="/admin" className={({ isActive }) => (isActive ? "active" : "")}>Admin</NavLink>
          )}
          {user ? (
            <>
              <span className="muted">{user.name} · {user.role}</span>
              <button className="btn secondary" onClick={() => { logout(); navigate("/login"); }}>Log out</button>
            </>
          ) : (
            <NavLink to="/login" className="btn secondary">Log in</NavLink>
          )}
        </div>
      </div>
    </div>
  );
}
