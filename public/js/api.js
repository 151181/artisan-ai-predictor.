import { showError } from "./ui.js"; // Import the custom error handler

// api.js — small helper to centralize API base and auth
const API_BASE = (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost")
  ? "http://localhost:5000/api" : "/api";

export async function fetchJSON(url, opts = {}) {
  const token = localStorage.getItem("token");
  const headers = opts.headers || {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  headers["Accept"] = "application/json";
  if (!(opts.body instanceof FormData)) headers["Content-Type"] = headers["Content-Type"] || "application/json";
  
  const res = await fetch(`${API_BASE}${url}`, {...opts, headers});
  
  if (!res.ok) {
    const err = await res.json().catch(()=>({message:"Network error"}));
    // Use the custom error handler instead of throwing or alerting
    showError(err);
    throw new Error(err.message || "API call failed."); // Still throw to stop the calling function
  }
  return res.json();
}
export async function postJSON(url, data, opts = {}) {
  return fetchJSON(url, {
    method: "POST",
    body: JSON.stringify(data),
    ...opts,
  });
} export async function putJSON(url, data, opts = {}) {
  return fetchJSON(url, {
    method: "PUT",
    body: JSON.stringify(data),
    ...opts,
  });
} export async function deleteJSON(url, opts = {}) {
  return fetchJSON(url, {
    method: "DELETE",
    ...opts,
  });
} export { API_BASE };