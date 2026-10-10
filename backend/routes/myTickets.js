
const express = require("express");
const Ticket = require("../models/Ticket");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.get("/", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "author") {
      return res.status(403).json({ message: "Authors only." });
    }

    const tickets = await Ticket.find({
      author_id: req.user.authorKey,
    })
      .select("-internal_notes")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ tickets });
  } catch (error) {
    console.error("My tickets error:", error);
    res.status(500).json({ message: "Unable to load tickets." });
  }
});

module.exports = router;
