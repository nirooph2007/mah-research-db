const mongoose = require("mongoose");

// ---- "Table": reviews ----
const reviewSchema = new mongoose.Schema(
  {
    // FK -> papers._id
    paperId: { type: mongoose.Schema.Types.ObjectId, ref: "Paper", required: true },
    // FK -> users._id (must have role "reviewer" or "admin")
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    score: { type: Number, min: 1, max: 10, required: true },
    comments: { type: String, default: "" },
    recommendation: {
      type: String,
      enum: ["accept", "minor_revision", "major_revision", "reject"],
      required: true,
    },
  },
  { timestamps: true }
);

// =====================================================================
// TRIGGER #2  (application-level trigger, equivalent to an RDBMS
// AFTER INSERT trigger on a "reviews" table)
//
// WHEN a new review is inserted for a paper
// THEN  automatically: recompute avgReviewScore on the parent paper
//       (aggregate function AVG), flip status to "under_review" if it
//       was still "submitted", and notify the paper's author.
// =====================================================================
reviewSchema.post("save", async function (doc) {
  const Review = mongoose.model("Review");
  const Paper = mongoose.model("Paper");
  const Notification = mongoose.model("Notification");

  const [agg] = await Review.aggregate([
    { $match: { paperId: doc.paperId } },
    { $group: { _id: "$paperId", avgScore: { $avg: "$score" }, count: { $sum: 1 } } },
  ]);

  const paper = await Paper.findById(doc.paperId);
  if (!paper) return;

  const update = { avgReviewScore: agg ? Math.round(agg.avgScore * 10) / 10 : doc.score };
  if (paper.status === "submitted") update.status = "under_review";
  await Paper.updateOne({ _id: paper._id }, { $set: update });

  await Notification.create({
    userId: paper.authorId,
    message: `A new review (score ${doc.score}/10) was added to your paper "${paper.title}".`,
    type: "new_review",
  });
  console.log(`[TRIGGER new_review] fired for paper ${doc.paperId}, new avg=${update.avgReviewScore}`);
});

module.exports = mongoose.model("Review", reviewSchema);
