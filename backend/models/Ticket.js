
const mongoose = require("mongoose");

const TicketSchema = new mongoose.Schema(
  {
    author_id: {
      type: String,
      required: true,
      index: true,
    },
    author_email: {
      type: String,
      required: true,
      index: true,
    },
    book_id: { type: String, default: "general" },
    subject: { type: String, required: true },
    description: { type: String, required: true },

    ai_category: {
      type: String,
      default: "Other",
    },
    ai_priority: {
      type: String,
      enum: ["Critical", "High", "Medium", "Low"],
      default: "Medium",
    },
    ai_draft_response: { type: String, default: "" },

    // Final response visible to the author
    admin_response: { type: String, default: "" },

    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved", "Closed"],
      default: "Open",
      index: true,
    },

    // Admin-only notes; never return these in author responses
    internal_notes: [{ type: String }],

    updated_by: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", TicketSchema);
