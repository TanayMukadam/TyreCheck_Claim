// src/components/PrivateRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const location = useLocation();

  // check multiple storage locations + common key names
  const keysToCheck = ["access_token", "accessToken", "token", "auth_token"];
  const getFromStorage = (key) =>
    localStorage.getItem(key) ?? sessionStorage.getItem(key) ?? null;

  // try to find any non-empty token value
  let token = null;
  for (const k of keysToCheck) {
    const v = getFromStorage(k);
    if (v) {
      token = v;
      break;
    }
  }

  // also consider a refresh/access pair under different names (optional)
  if (!token) {
    const alt = getFromStorage("refresh_token") || getFromStorage("refreshToken");
    if (alt) token = alt;
  }

  // check isAuth flag (either boolean string "true" or boolean true in storage)
  const rawIsAuthLocal = localStorage.getItem("isAuth");
  const rawIsAuthSession = sessionStorage.getItem("isAuth");
  const isAuth =
    rawIsAuthLocal === "true" ||
    rawIsAuthLocal === true ||
    rawIsAuthSession === "true" ||
    rawIsAuthSession === true;

  // debug output (remove when resolved)
  console.debug("PrivateRoute debug:", {
    tokenFound: !!token,
    tokenSample: token ? String(token).slice(0, 20) : null,
    rawIsAuthLocal,
    rawIsAuthSession,
    isAuth,
    locationPath: location.pathname,
  });

  if (!token && !isAuth) {
    // redirect to login; pass attempted location so login can return user
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
}
