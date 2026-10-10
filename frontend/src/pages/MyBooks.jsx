
import { useEffect, useState } from "react";
import { apiRequest } from "../api";

function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function displayDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString("en-IN");
}

export default function MyBooks() {
  const [books, setBooks] = useState([]);
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function loadBooks() {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/api/books/my");
      setBooks(data.books || []);
      setAuthor(data.author || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBooks();
  }, []);

  const filteredBooks = books.filter((book) =>
    [book.title, book.isbn, book.genre, book.status]
      .some((value) =>
        String(value || "").toLowerCase().includes(search.toLowerCase())
      )
  );

  const totalSales = books.reduce(
    (sum, book) => sum + Number(book.copies_sold || 0), 0
  );
  const totalEarned = books.reduce(
    (sum, book) => sum + Number(book.royalty_earned || 0), 0
  );
  const totalPaid = books.reduce(
    (sum, book) => sum + Number(book.royalty_paid || 0), 0
  );
  const totalPending = books.reduce(
    (sum, book) => sum + Number(book.royalty_pending || 0), 0
  );

  return (
    <section>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR CATALOGUE</span>
          <h1>My Books</h1>
          <p className="muted">
            {author?.name || author?.email || "Your published titles and royalty overview."}
          </p>
        </div>
        <button className="button button-outline" onClick={loadBooks} disabled={loading}>
          ↻ Refresh
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="stat-grid">
        <Stat label="Total books" value={books.length} detail="Titles in your catalogue" />
        <Stat label="Copies sold" value={totalSales.toLocaleString("en-IN")} detail="Across listed titles" />
        <Stat label="Royalty earned" value={formatMoney(totalEarned)} detail="Recorded earnings" />
        <Stat label="Royalty pending" value={formatMoney(totalPending)} detail="Recorded unpaid amount" />
      </div>

      <div className="section-toolbar">
        <div>
          <h2>Your catalogue</h2>
          <p className="muted">{filteredBooks.length} of {books.length} titles</p>
        </div>
        <input
          className="search-input"
          aria-label="Search books"
          placeholder="Search title, ISBN, genre…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="empty-state">Loading your books…</div>
      ) : filteredBooks.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">▤</span>
          <h3>{books.length ? "No matching books" : "No books found"}</h3>
          <p className="muted">
            {books.length
              ? "Try another search term."
              : "No book records are associated with this account."}
          </p>
        </div>
      ) : (
        <div className="data-card table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Book</th>
                <th>ISBN</th>
                <th>Genre</th>
                <th>Publication date</th>
                <th>Status</th>
                <th>MRP</th>
                <th>Copies sold</th>
                <th>Earned</th>
                <th>Paid</th>
                <th>Pending</th>
              </tr>
            </thead>
            <tbody>
              {filteredBooks.map((book, index) => (
                <tr key={book.isbn || book._id || index}>
                  <td className="book-title-cell">{book.title || "Untitled"}</td>
                  <td>{book.isbn || "—"}</td>
                  <td>{book.genre || "—"}</td>
                  <td>{displayDate(book.publication_date)}</td>
                  <td><span className="status-pill">{book.status || "Unknown"}</span></td>
                  <td>{formatMoney(book.mrp)}</td>
                  <td>{book.copies_sold ?? "—"}</td>
                  <td>{formatMoney(book.royalty_earned)}</td>
                  <td>{formatMoney(book.royalty_paid)}</td>
                  <td>{formatMoney(book.royalty_pending)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="table-note">
        Royalty figures reflect the values available in the imported dataset.
      </p>
      <div className="stat-grid stat-grid-small">
        <Stat label="Royalty paid" value={formatMoney(totalPaid)} detail="Recorded payments" />
        <Stat label="Pending royalty" value={formatMoney(totalPending)} detail="Awaiting payment" />
      </div>
    </section>
  );
}

function Stat({ label, value, detail }) {
  return (
    <article className="stat-card">
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      <span className="stat-detail">{detail}</span>
    </article>
  );
}
