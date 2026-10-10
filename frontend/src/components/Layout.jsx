
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearSession, getUser } from "../api";

export default function Layout() {
  const navigate = useNavigate();
  const user = getUser();
  const isAdmin = user?.role === "admin";

  function logout() {
    clearSession();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink className="brand" to={isAdmin ? "/admin" : "/books"}>
          <span className="brand-mark">B</span>
          <span>
            <strong>BookLeaf</strong>
            <small>AUTHOR SUPPORT PORTAL</small>
          </span>
        </NavLink>

        <div className="account-area">
          <div className="account-info">
            <span className="avatar">
              {(user?.email || "U").charAt(0).toUpperCase()}
            </span>
            <span className="account-text">
              <strong>{user?.email}</strong>
              <small>{isAdmin ? "Administrator" : "Author account"}</small>
            </span>
          </div>
          <button className="button button-outline button-small" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      <div className="app-body">
        <aside className="sidebar">
          <p className="sidebar-label">WORKSPACE</p>

          {isAdmin ? (
            <NavLink className="nav-link" to="/admin">
              <span>▤</span> Ticket Queue
            </NavLink>
          ) : (
            <>
              <NavLink className="nav-link" to="/books">
                <span>▦</span> My Books
              </NavLink>
              <NavLink className="nav-link" to="/tickets">
                <span>☷</span> My Tickets
              </NavLink>
              <NavLink className="nav-link" to="/create-ticket">
                <span>＋</span> Create Ticket
              </NavLink>
            </>
          )}

          <div className="sidebar-bottom">
            <strong>Need assistance?</strong>
            <p>Submit a support ticket and our team will review your query.</p>
            {!isAdmin && (
              <NavLink to="/create-ticket" className="sidebar-cta">
                Contact support →
              </NavLink>
            )}
          </div>
        </aside>

        <main className="main-content">
          <Outlet />
          <footer className="footer">
            BookLeaf Publishing · Author Support
          </footer>
        </main>
      </div>
    </div>
  );
}
