
import { useEffect, useState } from "react";
import { apiRequest } from "../api";

const CATEGORIES = [
  "Royalty & Payments",
  "ISBN & Metadata Issues",
  "Printing & Quality",
  "Distribution & Availability",
  "Book Status & Production Updates",
  "General Inquiry",
];

const PRIORITIES = ["Critical", "High", "Medium", "Low"];
const STATUSES = ["Open", "In Progress", "Resolved", "Closed"];

export default function AdminDashboard() {
  const [tickets, setTickets] = useState([]);
  const [status, setStatus] = useState("All");
  const [category, setCategory] = useState("All");
  const [priority, setPriority] = useState("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadTickets() {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (status !== "All") params.set("status", status);
      if (category !== "All") params.set("category", category);
      if (priority !== "All") params.set("priority", priority);
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const data = await apiRequest(`/api/admin/tickets?${params.toString()}`);
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

  async function updateTicket(id, updates) {
    setError("");
    setNotice("");

    try {
      await apiRequest(`/api/admin/tickets/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });

      setNotice("Ticket updated successfully.");
      await loadTickets();
    } catch (err) {
      setError(err.message);
    }
  }

  const openCount = tickets.filter((t) => t.status === "Open").length;
  const inProgressCount = tickets.filter((t) => t.status === "In Progress").length;
  const resolvedCount = tickets.filter((t) => t.status === "Resolved").length;
  const criticalCount = tickets.filter((t) => t.ai_priority === "Critical").length;

  return (
    <section>
      <div className="page-heading">
        <div>
          <span className="eyebrow">SUPPORT OPERATIONS</span>
          <h1>Ticket Queue</h1>
          <p className="muted">Review AI suggestions, manage responses and resolve author requests.</p>
        </div>
        <button className="button button-outline" onClick={loadTickets} disabled={loading}>
          ↻ Refresh queue
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}

      <div className="stat-grid admin-stats">
        <Stat label="Tickets shown" value={tickets.length} />
        <Stat label="Open" value={openCount} />
        <Stat label="In progress" value={inProgressCount} />
        <Stat label="Resolved" value={resolvedCount} />
      </div>

      <section className="filter-panel">
        <div className="filter-panel-heading">
          <div>
            <h3>Filter tickets</h3>
            <p className="muted">Narrow the queue by status, category, priority or date.</p>
          </div>
          <button
            className="button button-text"
            onClick={() => {
              setStatus("All");
              setCategory("All");
              setPriority("All");
              setFrom("");
              setTo("");
            }}
          >
            Clear filters
          </button>
        </div>

        <div className="filter-grid">
          <Filter label="Status" value={status} onChange={setStatus} options={["All", ...STATUSES]} />
          <Filter label="Category" value={category} onChange={setCategory} options={["All", ...CATEGORIES]} />
          <Filter label="Priority" value={priority} onChange={setPriority} options={["All", ...PRIORITIES]} />
          <div><label>From date</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><label>To date</label><input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} /></div>
        </div>

        <button className="button button-primary" onClick={loadTickets} disabled={loading}>
          Apply filters
        </button>
      </section>

      {criticalCount > 0 && (
        <div className="alert alert-warning">
          {criticalCount} ticket(s) in the current results have Critical AI priority. Review them promptly.
        </div>
      )}

      <div className="queue-heading">
        <h2>Incoming requests</h2>
        <span className="muted">{tickets.length} ticket(s)</span>
      </div>

      {loading ? (
        <div className="empty-state">Loading ticket queue…</div>
      ) : tickets.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">☷</span>
          <h3>No tickets found</h3>
          <p className="muted">Try changing your filters or refresh the queue.</p>
        </div>
      ) : (
        <div className="admin-ticket-list">
          {tickets.map((ticket) => (
            <AdminTicket key={ticket._id} ticket={ticket} onSave={updateTicket} />
          ))}
        </div>
      )}
    </section>
  );
}

function Filter({ label, value, onChange, options }) {
  return (
    <div>
      <label>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <article className="stat-card">
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
    </article>
  );
}

function AdminTicket({ ticket, onSave }) {
  const [category, setCategory] = useState(ticket.ai_category || "General Inquiry");
  const [priority, setPriority] = useState(ticket.ai_priority || "Medium");
  const [status, setStatus] = useState(ticket.status || "Open");
  const [draft, setDraft] = useState(ticket.ai_draft_response || "");
  const [response, setResponse] = useState(ticket.admin_response || "");
  const [note, setNote] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save(updates) {
    setSaving(true);
    try {
      await onSave(ticket._id, updates);
    } finally {
      setSaving(false);
    }
  }

  async function addNote() {
    if (!note.trim()) return;
    await save({ internal_note: note.trim() });
    setNote("");
  }

  return (
    <article className="admin-ticket-card">
      <div className="admin-ticket-top">
        <div className="ticket-heading-copy">
          <span className="ticket-reference">
            TICKET · {String(ticket._id || "").slice(-6).toUpperCase()}
          </span>
          <h3>{ticket.subject}</h3>
          <p className="muted">
            Author: {ticket.author_email || ticket.author_id || "Unknown"}
            {" · "}
            Submitted: {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString("en-IN") : "—"}
          </p>
        </div>

        <div className="ticket-badges">
          <span className={`priority-pill priority-${priority.toLowerCase()}`}>{priority}</span>
          <span className="status-pill">{status}</span>
        </div>
      </div>

      <p className="admin-description">{ticket.description}</p>
      <p className="ticket-book-reference">
        Related book: {ticket.book_id === "general" ? "General / Account Level" : ticket.book_id || "General / Account Level"}
      </p>

      <button className="button button-text" onClick={() => setExpanded(!expanded)}>
        {expanded ? "Hide review details ↑" : "Review classification and response ↓"}
      </button>

      {expanded && (
        <div className="admin-editor">
          <div className="admin-edit-grid">
            <Filter label="Category" value={category} onChange={setCategory} options={CATEGORIES} />
            <Filter label="Priority" value={priority} onChange={setPriority} options={PRIORITIES} />
            <Filter label="Status" value={status} onChange={setStatus} options={STATUSES} />
          </div>

          <button
            className="button button-outline"
            disabled={saving}
            onClick={() => save({
              ai_category: category,
              ai_priority: priority,
              status,
            })}
          >
            Save classification and status
          </button>

          <label>AI-generated draft response</label>
          <textarea
            rows={4}
            maxLength={5000}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button
            className="button button-outline"
            disabled={saving}
            onClick={() => save({ ai_draft_response: draft })}
          >
            Save edited draft
          </button>

          <div className="editor-divider" />

          <label>Final response to author</label>
          <p className="muted">Review and edit the message before saving it for the author to see.</p>
          <textarea
            rows={4}
            maxLength={5000}
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Write the response you want the author to receive…"
          />
          <button
            className="button button-primary"
            disabled={saving || !response.trim()}
            onClick={() => save({
              admin_response: response.trim(),
              status: status === "Open" ? "In Progress" : status,
            })}
          >
            Save response for author
          </button>

          <div className="editor-divider" />

          <label>Internal note — admin only</label>
          <textarea
            rows={2}
            maxLength={2000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Record internal context. This is not shown to the author."
          />
          <button
            className="button button-outline"
            disabled={saving || !note.trim()}
            onClick={addNote}
          >
            Add internal note
          </button>

          {ticket.internal_notes?.length > 0 && (
            <div className="internal-notes">
              <strong>Existing internal notes</strong>
              {ticket.internal_notes.map((item, index) => (
                <p key={`${ticket._id}-note-${index}`}>{item}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
