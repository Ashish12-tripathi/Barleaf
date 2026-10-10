
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../api";

export default function CreateTicket() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [bookId, setBookId] = useState("general");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("/api/books/my")
      .then((data) => setBooks(data.books || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoadingBooks(false));
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await apiRequest("/api/tickets/create", {
        method: "POST",
        body: JSON.stringify({ subject, description, book_id: bookId }),
      });

      navigate("/tickets", {
        replace: true,
        state: { notice: "Your support ticket has been submitted." },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="form-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">AUTHOR SUPPORT</span>
          <h1>Create a ticket</h1>
          <p className="muted">
            Tell us what you need help with. Our support team will review your query.
          </p>
        </div>
      </div>

      <div className="form-layout">
        <form className="form-card" onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-section-heading">
            <span className="step-number">01</span>
            <div>
              <h3>What is your query about?</h3>
              <p className="muted">Select the related book or your account.</p>
            </div>
          </div>

          <label htmlFor="book">Related book</label>
          <select
            id="book"
            value={bookId}
            onChange={(e) => setBookId(e.target.value)}
            disabled={loadingBooks}
          >
            <option value="general">General / Account Level</option>
            {books.map((book, index) => {
              const value = String(book.isbn || book._id || book.title || "");
              return value ? (
                <option key={value || index} value={value}>
                  {book.title || `Book ${index + 1}`}
                  {book.isbn ? ` · ISBN ${book.isbn}` : ""}
                </option>
              ) : null;
            })}
          </select>

          <div className="form-section-heading form-section-spaced">
            <span className="step-number">02</span>
            <div>
              <h3>Describe the issue</h3>
              <p className="muted">Include the details our team needs to help.</p>
            </div>
          </div>

          <label htmlFor="subject">Subject</label>
          <input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={200}
            required
            placeholder="e.g. Question about royalty payment"
          />
          <div className="field-meta">{subject.length}/200 characters</div>

          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={10000}
            minLength={5}
            rows={7}
            required
            placeholder="Explain your query, including any relevant details…"
          />
          <div className="field-meta">{description.length}/10000 characters</div>

          <div className="form-actions">
            <Link to="/tickets" className="button button-outline">Cancel</Link>
            <button className="button button-primary" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit ticket →"}
            </button>
          </div>
        </form>

        <aside className="help-card">
          <span className="help-icon">✳</span>
          <h3>What happens next?</h3>
          <ol>
            <li>Your ticket is saved to the support queue.</li>
            <li>AI suggests a category, priority and draft response.</li>
            <li>A support administrator reviews the ticket.</li>
            <li>You can follow progress in My Tickets.</li>
          </ol>
          <p className="help-footnote">
            AI suggestions may need review. Account-specific details should be verified by the support team.
          </p>
        </aside>
      </div>
    </section>
  );
}
