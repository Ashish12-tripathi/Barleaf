
import { useEffect, useState } from "react";
import "./index.css";

const API = (import.meta.env.VITE_API_URL || "http://localhost:5000")
  .replace(/\/$/, "");

async function request(path, token, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

export default function App() {
  const [token, setToken] = useState(
    () => sessionStorage.getItem("bookleaf_token") || ""
  );
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("bookleaf_user") || "null");
    } catch {
      return null;
    }
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [page, setPage] = useState("books");
  const [books, setBooks] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [author, setAuthor] = useState(null);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [bookId, setBookId] = useState("general");
  const [filter, setFilter] = useState("All");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  function logout() {
    sessionStorage.removeItem("bookleaf_token");
    sessionStorage.removeItem("bookleaf_user");
    setToken("");
    setUser(null);
    setBooks([]);
    setTickets([]);
    setAuthor(null);
    setPassword("");
    setPage("books");
  }

  async function login(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const data = await request("/api/auth/login", "", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      sessionStorage.setItem("bookleaf_token", data.token);
      sessionStorage.setItem("bookleaf_user", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setPage(data.user.role === "admin" ? "admin" : "books");
      setMessage("Login successful.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function loadBooks() {
    const data = await request("/api/books/my", token);
    setBooks(data.books || []);
    setAuthor(data.author || null);
  }

  async function loadMyTickets() {
    const data = await request("/api/my-tickets", token);
    setTickets(data.tickets || []);
  }

  async function loadAdminTickets() {
    const params = new URLSearchParams();
    if (filter !== "All") params.set("status", filter);
    const data = await request(
      `/api/admin/tickets?${params.toString()}`,
      token
    );
    setTickets(data.tickets || []);
  }

  useEffect(() => {
    if (!token || !user) return;

    let cancelled = false;

    async function load() {
      try {
        if (user.role === "admin") {
          const data = await request("/api/admin/tickets", token);
          if (!cancelled) setTickets(data.tickets || []);
        } else {
          const data = await request("/api/books/my", token);
          if (!cancelled) {
            setBooks(data.books || []);
            setAuthor(data.author || null);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(error.message);
          if (/session|log in|invalid/i.test(error.message)) logout();
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token, user]);

  async function createTicket(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      await request("/api/tickets/create", token, {
        method: "POST",
        body: JSON.stringify({ subject, description, book_id: bookId }),
      });

      setSubject("");
      setDescription("");
      setBookId("general");
      setMessage("Ticket submitted successfully.");
      await loadMyTickets();
      setPage("tickets");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function updateTicket(id, updates) {
    try {
      await request(`/api/admin/tickets/${id}`, token, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      setMessage("Ticket updated.");
      await loadAdminTickets();
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (!token || !user) {
    return (
      <main className="login-wrap">
        <form className="panel login" onSubmit={login}>
          <p className="eyebrow">BOOKLEAF PUBLISHING</p>
          <h1>Author Support Portal</h1>
          <p>Sign in to manage books and support requests.</p>
          <label>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="author@example.com"
          />
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password (admin only)"
          />
          <button disabled={busy}>
            {busy ? "Signing in..." : "Sign in"}
          </button>
          {message && <p className="notice">{message}</p>}
          <small>
            Authors: use an email already present in the imported dataset.
            Admins: use ADMIN_EMAIL and ADMIN_PASSWORD.
          </small>
        </form>
      </main>
    );
  }

  const isAdmin = user.role === "admin";

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">BOOKLEAF PUBLISHING</p>
          <h2>Support Portal</h2>
        </div>
        <div className="account">
          <span>{user.email}</span>
          <button className="secondary" onClick={logout}>Log out</button>
        </div>
      </header>

      <nav className="nav">
        {(isAdmin
          ? [["admin", "Ticket Queue"]]
          : [
              ["books", "My Books"],
              ["tickets", "My Tickets"],
              ["create", "Create Ticket"],
            ]
        ).map(([key, label]) => (
          <button
            key={key}
            className={page === key ? "nav-active" : "nav-button"}
            onClick={() => {
              setPage(key);
              setMessage("");
              if (key === "tickets") loadMyTickets().catch(e => setMessage(e.message));
              if (key === "admin") loadAdminTickets().catch(e => setMessage(e.message));
              if (key === "books") loadBooks().catch(e => setMessage(e.message));
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      <main className="content">
        {message && <p className="notice">{message}</p>}

        {!isAdmin && page === "books" && (
          <>
            <h1>My Books</h1>
            <p className="muted">{author?.name || author?.email || user.email}</p>
            <div className="stats">
              <div className="panel"><span>Total books</span><strong>{books.length}</strong></div>
              <div className="panel"><span>Copies sold</span><strong>{books.reduce((s,b) => s + Number(b.copies_sold || 0), 0)}</strong></div>
              <div className="panel"><span>Royalty earned</span><strong>{money(books.reduce((s,b) => s + Number(b.royalty_earned || 0), 0))}</strong></div>
              <div className="panel"><span>Royalty pending</span><strong>{money(books.reduce((s,b) => s + Number(b.royalty_pending || 0), 0))}</strong></div>
            </div>
            <div className="panel table-wrap">
              <table>
                <thead><tr>
                  {["Title", "ISBN", "Genre", "Published", "Status", "MRP", "Copies Sold", "Earned", "Paid", "Pending"].map(x => <th key={x}>{x}</th>)}
                </tr></thead>
                <tbody>
                  {books.map((b, i) => (
                    <tr key={b.isbn || b._id || i}>
                      <td>{b.title || "—"}</td><td>{b.isbn || "—"}</td>
                      <td>{b.genre || "—"}</td>
                      <td>{b.publication_date ? String(b.publication_date).slice(0, 10) : "—"}</td>
                      <td><span className="status">{b.status || "—"}</span></td>
                      <td>{money(b.mrp)}</td><td>{b.copies_sold ?? "—"}</td>
                      <td>{money(b.royalty_earned)}</td><td>{money(b.royalty_paid)}</td><td>{money(b.royalty_pending)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!books.length && <p>No books found for this author.</p>}
            </div>
          </>
        )}

        {!isAdmin && page === "create" && (
          <>
            <h1>Create a Support Ticket</h1>
            <form className="panel form-panel" onSubmit={createTicket}>
              <label>Related book</label>
              <select value={bookId} onChange={e => setBookId(e.target.value)}>
                <option value="general">General / Account Level</option>
                {books.map((b, i) => (
                  <option key={b.isbn || b._id || i} value={b.isbn || b._id || b.title}>
                    {b.title || `Book ${i + 1}`}
                  </option>
                ))}
              </select>
              <label>Subject</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} maxLength={200} required />
              <label>Describe your query</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={10000} rows={6} required />
              <button disabled={busy}>{busy ? "Submitting..." : "Submit ticket"}</button>
            </form>
          </>
        )}

        {!isAdmin && page === "tickets" && (
          <>
            <h1>My Tickets</h1>
            <button className="secondary" onClick={() => loadMyTickets().catch(e => setMessage(e.message))}>Refresh</button>
            <div className="ticket-list">
              {tickets.map(t => (
                <article className="panel" key={t._id}>
                  <div className="ticket-head">
                    <h3>{t.subject}</h3><span className="status">{t.status}</span>
                  </div>
                  <p>{t.description}</p>
                  <p className="muted">Category: {t.ai_category} · Priority: {t.ai_priority}</p>
                  {t.admin_response && <div className="response"><strong>Support response</strong><p>{t.admin_response}</p></div>}
                  <small>Created: {new Date(t.createdAt).toLocaleString()}</small>
                </article>
              ))}
              {!tickets.length && <p>You haven't submitted any tickets yet.</p>}
            </div>
          </>
        )}

        {isAdmin && page === "admin" && (
          <>
            <h1>Admin Ticket Queue</h1>
            <div className="filters">
              <label>Filter status</label>
              <select value={filter} onChange={e => setFilter(e.target.value)}>
                {["All", "Open", "In Progress", "Resolved", "Closed"].map(s => <option key={s}>{s}</option>)}
              </select>
              <button className="secondary" onClick={() => loadAdminTickets().catch(e => setMessage(e.message))}>Apply / Refresh</button>
            </div>
            <div className="ticket-list">
              {tickets.map(t => (
                <AdminTicket key={t._id} ticket={t} onSave={updateTicket} />
              ))}
              {!tickets.length && <p>No tickets match this filter.</p>}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function AdminTicket({ ticket, onSave }) {
  const [category, setCategory] = useState(ticket.ai_category || "Other");
  const [priority, setPriority] = useState(ticket.ai_priority || "Medium");
  const [status, setStatus] = useState(ticket.status || "Open");
  const [draft, setDraft] = useState(ticket.ai_draft_response || "");
  const [response, setResponse] = useState(ticket.admin_response || "");
  const [note, setNote] = useState("");

  const categories = ["Royalties", "Payments", "Publishing", "Marketing", "Book Distribution", "Technical Support", "Other"];
  const priorities = ["Critical", "High", "Medium", "Low"];
  const statuses = ["Open", "In Progress", "Resolved", "Closed"];

  return (
    <article className="panel admin-ticket">
      <div className="ticket-head">
        <h3>{ticket.subject}</h3><span className="status">{ticket.status}</span>
      </div>
      <p>{ticket.description}</p>
      <p className="muted">Author: {ticket.author_email} · Book: {ticket.book_id || "general"}</p>
      <div className="admin-grid">
        <div><label>Category</label><select value={category} onChange={e => setCategory(e.target.value)}>{categories.map(x => <option key={x}>{x}</option>)}</select></div>
        <div><label>Priority</label><select value={priority} onChange={e => setPriority(e.target.value)}>{priorities.map(x => <option key={x}>{x}</option>)}</select></div>
        <div><label>Status</label><select value={status} onChange={e => setStatus(e.target.value)}>{statuses.map(x => <option key={x}>{x}</option>)}</select></div>
      </div>
      <label>AI draft — edit before sending</label>
      <textarea rows={4} value={draft} onChange={e => setDraft(e.target.value)} />
      <button className="secondary" onClick={() => onSave(ticket._id, { ai_category: category, ai_priority: priority, status, ai_draft_response: draft })}>Save classification / draft</button>
      <label>Final response to author</label>
      <textarea rows={4} value={response} onChange={e => setResponse(e.target.value)} placeholder="Write the response to send to the author..." />
      <button onClick={() => onSave(ticket._id, { admin_response: response, status: status === "Open" ? "In Progress" : status })}>Save response</button>
      <label>Internal note (admin only)</label>
      <input value={note} onChange={e => setNote(e.target.value)} placeholder="Add an internal note" />
      <button className="secondary" disabled={!note.trim()} onClick={() => { onSave(ticket._id, { internal_note: note }); setNote(""); }}>Add internal note</button>
    </article>
  );
}
