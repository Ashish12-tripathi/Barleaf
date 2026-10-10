
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const ticketRoutes = require("./routes/tickets");
const authRoutes = require("./routes/auth");
const booksRoutes = require("./routes/books");
const myTicketsRoutes = require("./routes/myTickets");
const adminRoutes = require("./routes/admin");

const app = express();

const allowedOrigins = (
  process.env.FRONTEND_URL || "http://localhost:5173"
)
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without an Origin header, such as Postman.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
  })
);

app.use(express.json({ limit: "20kb" }));

app.get("/", (req, res) => {
  res.json({ message: "BookLeaf Support API is running." });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

app.use("/api/tickets", ticketRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/books", booksRoutes);
app.use("/api/my-tickets", myTicketsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/tickets", ticketRoutes);

// Return JSON for invalid routes.
app.use((req, res) => {
  res.status(404).json({ message: "API route not found." });
});

// Handle errors, including CORS errors.
app.use((err, req, res, next) => {
  console.error("Request error:", err.message);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    message: "Something went wrong on the server.",
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing from your .env file.");
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB Connected");

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Startup failed:", error.message);
  process.exit(1);
});