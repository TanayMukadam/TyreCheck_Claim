// src/components/PrivateRoute.jsx
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const token = localStorage.getItem("access_token");

  const isAuth = localStorage.getItem("isAuth") === "true";

  if (!token && !isAuth) {
    return <Navigate to="/" replace />;
  }

  return children;
}
