const express = require("express");
const Review = require("../models/Review");
const { authRequired } = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");

const router = express.Router();

// SELECT * FROM reviews WHERE paperId = ?
router.get("/paper/:paperId", async (req, res) => {
  const reviews = await Review.find({ paperId: req.params.paperId }).populate("reviewerId", "name");
  res.json(reviews);
});

// INSERT INTO reviews ...  -> fires TRIGGER #2 (recompute avg, notify author)
router.post("/", authRequired, requireRole("reviewer", "admin", "superadmin"), async (req, res) => {
  const { paperId, score, comments, recommendation } = req.body;
  const review = await Review.create({
    paperId,
    reviewerId: req.user.id,
    score,
    comments,
    recommendation,
  });
  res.status(201).json(review);
});

router.delete("/:id", authRequired, requireRole("admin", "superadmin"), async (req, res) => {
  await Review.findByIdAndDelete(req.params.id);
  res.json({ deleted: true });
});

module.exports = router;
