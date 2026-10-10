
const express = require("express");
const jwt = require("jsonwebtoken");
const Author = require("../models/Author");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();

    const password = String(req.body?.password || "");

    if (!email || !email.includes("@")) {
      return res.status(400).json({
        message: "Enter a valid email address.",
      });
    }

    let payload;

    const adminEmail = (
      process.env.ADMIN_EMAIL || ""
    ).trim().toLowerCase();

    if (
      email === adminEmail &&
      password &&
      password === process.env.ADMIN_PASSWORD
    ) {
      payload = {
        role: "admin",
        email,
      };
    } else {
      // Only allow emails that exist in the imported authors collection.
      const author = await Author.findOne({ email }).lean();

      if (!author) {
        return res.status(401).json({
          message: "No author found for this email.",
        });
      }

      payload = {
        role: "author",
        email: author.email,
        authorId: String(author._id),
        authorKey: String(author.author_id || author._id),
      };
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "8h",
    });

    res.json({
      token,
      user: {
        email: payload.email,
        role: payload.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Unable to log in." });
  }
});

module.exports = router;
