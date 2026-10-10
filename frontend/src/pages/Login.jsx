
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { apiRequest, getToken, getUser, saveSession } from "../api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  if (getToken() && getUser()) {
    return <Navigate to={getUser().role === "admin" ? "/admin" : "/books"} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      saveSession(data);

      const requestedPath = location.state?.from?.pathname;
      const defaultPath = data.user.role === "admin" ? "/admin" : "/books";

      navigate(
        requestedPath &&
        (data.user.role === "admin"
          ? requestedPath.startsWith("/admin")
          : ["/books", "/tickets", "/create-ticket"].includes(requestedPath))
          ? requestedPath
          : defaultPath,
        { replace: true }
      );
    } catch (err) {
      setError(err.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-screen">
      <section className="login-art">
        <Link to="/login" className="brand brand-light">
          <span className="brand-mark">B</span>
          <span><strong>BookLeaf</strong><small>PUBLISHING</small></span>
        </Link>

        <div className="login-message">
          <span className="eyebrow eyebrow-light">YOUR PUBLISHING JOURNEY</span>
          <h1>Your books.<br />Your progress.<br /><em>Your next chapter.</em></h1>
          <p>One place to view your books, follow royalties, and get help when you need it.</p>
        </div>

        <p className="login-art-footer">Supporting every story, from manuscript to reader.</p>
      </section>

      <section className="login-form-side">
        <form className="login-form" onSubmit={handleSubmit}>
          <span className="eyebrow">WELCOME BACK</span>
          <h2>Sign in to your portal</h2>
          <p className="muted">Enter your account details to continue.</p>

          {error && <div className="alert alert-error" role="alert">{error}</div>}

          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />

          <label htmlFor="password">Password <span className="label-hint">Admin only</span></label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password if applicable"
          />

          <button className="button button-primary button-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in →"}
          </button>

          <p className="login-help">
            Author access is currently based on an email in the imported dataset.
            Admin access requires the configured admin email and password.
          </p>
        </form>
      </section>
    </main>
  );
}
