const mongoose = require("mongoose");

// ---- "Table": papers ----
const paperSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    abstract: { type: String, required: true },
    keywords: [{ type: String }],
    // FK -> users._id (the submitting author)
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // FK -> journals._id
    journalId: { type: mongoose.Schema.Types.ObjectId, ref: "Journal", required: true },
    status: {
      type: String,
      enum: ["submitted", "under_review", "accepted", "rejected", "published"],
      default: "submitted",
    },
    avgReviewScore: { type: Number, default: null }, // maintained by trigger #2
    doi: { type: String, default: null },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// =====================================================================
// TRIGGER #1  (application-level trigger, fires inside the DB layer,
// not inside a route handler -- same idea as an RDBMS AFTER UPDATE trigger)
//
// WHEN a paper's `status` field is updated to "published"
// THEN  automatically: stamp publishedAt + generate a DOI + insert a
//       row into `notifications` for the author.
// =====================================================================
paperSchema.post("findOneAndUpdate", async function (doc) {
  if (!doc) return;
  const update = this.getUpdate();
  const newStatus = update?.$set?.status ?? update?.status;
  if (newStatus === "published" && !doc.publishedAt) {
    const Notification = mongoose.model("Notification");
    const doi = `10.5555/mah.${doc._id.toString().slice(-8)}`;
    await mongoose.model("Paper").updateOne(
      { _id: doc._id },
      { $set: { publishedAt: new Date(), doi } }
    );
    await Notification.create({
      userId: doc.authorId,
      message: `Your paper "${doc.title}" has been published. DOI: ${doi}`,
      type: "paper_published",
    });
    console.log(`[TRIGGER paper_published] fired for paper ${doc._id}`);
  }
});

module.exports = mongoose.model("Paper", paperSchema);
