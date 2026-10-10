
const mongoose = require("mongoose");

const BookSchema = new mongoose.Schema(
  {
    title: String,
    isbn: String,
    genre: String,
    publication_date: mongoose.Schema.Types.Mixed,
    status: String,
    mrp: Number,
    copies_sold: Number,
    royalty_earned: Number,
    royalty_paid: Number,
    royalty_pending: Number,
  },
  { _id: false, strict: false }
);

const AuthorSchema = new mongoose.Schema(
  {
    author_id: { type: String, index: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: String,
    books: [BookSchema],
  },
  { timestamps: true, strict: false }
);

module.exports = mongoose.model("Author", AuthorSchema);
