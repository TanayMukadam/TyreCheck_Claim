// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ViewClaim from "./pages/ViewClaim";
import PrivateRoute from "./routes/PrivateRoute";
import Login from "./pages/Login";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* LOGIN PAGE */}
        <Route path="/" element={<Login />} />

        {/* DASHBOARD (Protected) */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* VIEW CLAIM PAGE (Protected) */}
        <Route
          path="/claim/:id"
          element={
            <PrivateRoute>
              <ViewClaim />
            </PrivateRoute>
          }
        />

        {/* ANY UNKNOWN ROUTE → REDIRECT TO LOGIN */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
