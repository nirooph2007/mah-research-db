const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const Journal = require("../models/Journal");
const Paper = require("../models/Paper");
const Review = require("../models/Review");

const router = express.Router();

// Dashboard summary counts (COUNT aggregate)
router.get("/summary", async (req, res) => {
  const [totalUsers, totalJournals, totalPapers, published, underReview, submitted] = await Promise.all([
    User.countDocuments(),
    Journal.countDocuments(),
    Paper.countDocuments(),
    Paper.countDocuments({ status: "published" }),
    Paper.countDocuments({ status: "under_review" }),
    Paper.countDocuments({ status: "submitted" }),
  ]);
  res.json({ totalUsers, totalJournals, totalPapers, published, underReview, submitted });
});

// Aggregate function demo: papers published per journal, with AVG review score
// SQL equivalent:
//   SELECT j.title, COUNT(p.id) AS paper_count, AVG(p.avgReviewScore) AS avg_score
//   FROM journals j LEFT JOIN papers p ON p.journalId = j._id
//   GROUP BY j.title;
router.get("/papers-per-journal", async (req, res) => {
  const data = await Paper.aggregate([
    {
      $group: {
        _id: "$journalId",
        paperCount: { $sum: 1 },
        avgScore: { $avg: "$avgReviewScore" },
        published: { $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] } },
      },
    },
    {
      $lookup: { from: "journals", localField: "_id", foreignField: "_id", as: "journal" },
    },
    { $unwind: "$journal" },
    {
      $project: {
        _id: 0,
        journalTitle: "$journal.title",
        shortCode: "$journal.shortCode",
        paperCount: 1,
        published: 1,
        avgScore: { $round: [{ $ifNull: ["$avgScore", 0] }, 2] },
      },
    },
    { $sort: { paperCount: -1 } },
  ]);
  res.json(data);
});

// Read from the MongoDB VIEW created by scripts/create_views.js
// (db.createView("published_papers_view", "papers", pipeline))
router.get("/published-view", async (req, res) => {
  const conn = mongoose.connection;
  const rows = await conn.db.collection("published_papers_view").find({}).toArray();
  res.json(rows);
});

module.exports = router;
