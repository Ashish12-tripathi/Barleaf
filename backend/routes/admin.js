
const express = require("express");
const Ticket = require("../models/Ticket");
const {
  authenticate,
  requireAdmin,
} = require("../middleware/auth");

const router = express.Router();

router.use(authenticate, requireAdmin);

const categories = [
  "Royalties",
  "Payments",
  "Publishing",
  "Marketing",
  "Book Distribution",
  "Technical Support",
  "Other",
];

const priorities = ["Critical", "High", "Medium", "Low"];
const statuses = ["Open", "In Progress", "Resolved", "Closed"];

// GET /api/admin/tickets?status=Open&priority=High
router.get("/tickets", async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) {
      if (!statuses.includes(req.query.status)) {
        return res.status(400).json({ message: "Invalid status." });
      }
      filter.status = req.query.status;
    }

    if (req.query.category) {
      if (!categories.includes(req.query.category)) {
        return res.status(400).json({ message: "Invalid category." });
      }
      filter.ai_category = req.query.category;
    }

    if (req.query.priority) {
      if (!priorities.includes(req.query.priority)) {
        return res.status(400).json({ message: "Invalid priority." });
      }
      filter.ai_priority = req.query.priority;
    }

    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) {
        const from = new Date(req.query.from);
        if (Number.isNaN(from.getTime())) {
          return res.status(400).json({ message: "Invalid from date." });
        }
        filter.createdAt.$gte = from;
      }
      if (req.query.to) {
        const to = new Date(req.query.to);
        if (Number.isNaN(to.getTime())) {
          return res.status(400).json({ message: "Invalid to date." });
        }
        to.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = to;
      }
    }

    const tickets = await Ticket.find(filter)
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    res.json({ tickets });
  } catch (error) {
    console.error("Admin list error:", error);
    res.status(500).json({ message: "Unable to load tickets." });
  }
});

// PATCH /api/admin/tickets/:id
router.patch("/tickets/:id", async (req, res) => {
  try {
    const updates = {};
    const body = req.body || {};

    if (body.status !== undefined) {
      if (!statuses.includes(body.status)) {
        return res.status(400).json({ message: "Invalid status." });
      }
      updates.status = body.status;
    }

    if (body.ai_category !== undefined) {
      if (!categories.includes(body.ai_category)) {
        return res.status(400).json({ message: "Invalid category." });
      }
      updates.ai_category = body.ai_category;
    }

    if (body.ai_priority !== undefined) {
      if (!priorities.includes(body.ai_priority)) {
        return res.status(400).json({ message: "Invalid priority." });
      }
      updates.ai_priority = body.ai_priority;
    }

    if (body.ai_draft_response !== undefined) {
      if (typeof body.ai_draft_response !== "string" ||
          body.ai_draft_response.length > 5000) {
        return res.status(400).json({ message: "Invalid draft response." });
      }
      updates.ai_draft_response = body.ai_draft_response;
    }

    // Sending a final response also stores the final text and updates status.
    if (body.admin_response !== undefined) {
      if (typeof body.admin_response !== "string" ||
          body.admin_response.length > 5000) {
        return res.status(400).json({ message: "Invalid response." });
      }
      updates.admin_response = body.admin_response;
    }

    if (body.internal_note !== undefined) {
      if (typeof body.internal_note !== "string" ||
          body.internal_note.length > 2000) {
        return res.status(400).json({ message: "Invalid internal note." });
      }

      const ticket = await Ticket.findById(req.params.id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found." });
      }

      if (body.internal_note.trim()) {
        ticket.internal_notes.push(body.internal_note.trim());
      }

      ticket.updated_by = req.user.email;
      await ticket.save();

      return res.json({
        message: "Internal note added.",
        ticket: ticket.toObject(),
      });
    }

    updates.updated_by = req.user.email;

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found." });
    }

    res.json({ message: "Ticket updated.", ticket });
  } catch (error) {
    console.error("Admin update error:", error);
    res.status(500).json({ message: "Unable to update ticket." });
  }
});

module.exports = router;
