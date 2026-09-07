import React from "react";
import { Routes, Route } from "react-router-dom";
import Topbar from "./components/Topbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Journals from "./pages/Journals";
import JournalDetail from "./pages/JournalDetail";
import Papers from "./pages/Papers";
import PaperDetail from "./pages/PaperDetail";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <>
      <Topbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/journals" element={<Journals />} />
        <Route path="/journals/:id" element={<JournalDetail />} />
        <Route path="/papers" element={<Papers />} />
        <Route path="/papers/:id" element={<PaperDetail />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin", "superadmin"]}>
              <Admin />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}
