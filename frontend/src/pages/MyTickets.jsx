
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { apiRequest } from "../api";

const statusOptions = ["All", "Open", "In Progress", "Resolved", "Closed"];

export default function MyTickets() {
  const location = useLocation();
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(location.state?.notice || "");

  async function loadTickets() {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/api/my-tickets");
      setTickets(data.tickets || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
  }, []);

  const visibleTickets = tickets.filter(
    (ticket) => filter === "All" || ticket.status === filter
  );

  return (
    <section>
      <div className="page-heading">
        <div>
          <span className="eyebrow">SUPPORT HISTORY</span>
          <h1>My Tickets</h1>
          <p className="muted">Track your support requests and read responses.</p>
        </div>
        <Link className="button button-primary" to="/create-ticket">＋ New ticket</Link>
      </div>

      {notice && (
        <div className="alert alert-success">
          {notice}
          <button className="alert-close" onClick={() => setNotice("")} aria-label="Dismiss notice">×</button>
        </div>
      )}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="ticket-toolbar">
        <div className="filter-tabs" aria-label="Filter tickets by status">
          {statusOptions.map((status) => (
            <button
              key={status}
              className={filter === status ? "filter-tab active" : "filter-tab"}
              onClick={() => setFilter(status)}
            >
              {status}
              {status === "All" && <span className="filter-count">{tickets.length}</span>}
            </button>
          ))}
        </div>
        <button className="button button-outline button-small" onClick={loadTickets} disabled={loading}>
          ↻ Refresh
        </button>
      </div>

      {loading ? (
        <div className="empty-state">Loading tickets…</div>
      ) : visibleTickets.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">☷</span>
          <h3>No tickets here</h3>
          <p className="muted">
            {tickets.length ? "Try another status filter." : "Your submitted support requests will appear here."}
          </p>
          {!tickets.length && <Link className="button button-primary" to="/create-ticket">Create your first ticket</Link>}
        </div>
      ) : (
        <div className="ticket-list">
          {visibleTickets.map((ticket) => (
            <article className="ticket-card" key={ticket._id}>
              <div className="ticket-card-top">
                <div>
                  <span className="ticket-reference">
                    TICKET · {String(ticket._id || "").slice(-6).toUpperCase()}
                  </span>
                  <h3>{ticket.subject}</h3>
                </div>
                <span className={`status-pill status-${(ticket.status || "open").toLowerCase().replace(/\s+/g, "-")}`}>
                  {ticket.status || "Open"}
                </span>
              </div>

              <p className="ticket-description">{ticket.description}</p>

              <div className="ticket-meta">
                <span>Category: <strong>{ticket.ai_category || "General Inquiry"}</strong></span>
                <span>Priority: <strong>{ticket.ai_priority || "Medium"}</strong></span>
                <span>Book: <strong>{ticket.book_id === "general" ? "General / Account" : ticket.book_id || "General / Account"}</strong></span>
              </div>

              {ticket.admin_response && (
                <div className="support-response">
                  <div className="response-heading">
                    <span className="response-icon">↳</span>
                    <strong>Support team response</strong>
                  </div>
                  <p>{ticket.admin_response}</p>
                </div>
              )}

              <div className="ticket-card-footer">
                <span>Submitted {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString("en-IN") : "—"}</span>
                <span>Updated {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleDateString("en-IN") : "—"}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
