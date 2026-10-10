
const express = require("express");
const Author = require("../models/Author");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.get("/my", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "author") {
      return res.status(403).json({
        message: "This endpoint is for authors only.",
      });
    }

    const author = await Author.findById(req.user.authorId).lean();

    if (!author) {
      return res.status(404).json({
        message: "Author record not found.",
      });
    }

    res.json({
      author: {
        name: author.name || author.email,
        email: author.email,
      },
      books: Array.isArray(author.books) ? author.books : [],
    });
  } catch (error) {
    console.error("Books error:", error);
    res.status(500).json({ message: "Unable to load books." });
  }
});

module.exports = router;
