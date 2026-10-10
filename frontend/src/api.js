
const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export function getToken() {
  return sessionStorage.getItem("bookleaf_token") || "";
}

export function getUser() {
  try {
    return JSON.parse(sessionStorage.getItem("bookleaf_user") || "null");
  } catch {
    return null;
  }
}

export function saveSession(data) {
  sessionStorage.setItem("bookleaf_token", data.token);
  sessionStorage.setItem("bookleaf_user", JSON.stringify(data.user));
}

export function clearSession() {
  sessionStorage.removeItem("bookleaf_token");
  sessionStorage.removeItem("bookleaf_user");
}

export async function apiRequest(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    clearSession();
    window.dispatchEvent(new Event("bookleaf:unauthorized"));
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || `Request failed (${response.status})`);
  }

  return data;
}
