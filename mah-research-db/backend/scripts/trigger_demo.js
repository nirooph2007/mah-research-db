/**
 * TRIGGER demo: fires TRIGGER #1 (paper -> published) and TRIGGER #2
 * (new review -> recompute avg + notify). See models/Paper.js and
 * models/Review.js for the actual trigger code (Mongoose post-hooks,
 * MongoDB's equivalent of an RDBMS AFTER UPDATE / AFTER INSERT trigger).
 *
 * Run: node scripts/trigger_demo.js
 * Take a screenshot of the "[TRIGGER ...] fired" lines for your report.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Paper = require("../models/Paper");
const Review = require("../models/Review");
const User = require("../models/User");
const Notification = require("../models/Notification");

async function main() {
  await connectDB();

  const paper = await Paper.findOne({ status: { $ne: "published" } });
  const reviewer = await User.findOne({ role: "reviewer" });

  if (!paper || !reviewer) {
    console.log("Run `npm run dml:seed` first so there is sample data to trigger on.");
    process.exit(1);
  }

  console.log(`Using paper "${paper.title}" (${paper._id})\n`);

  console.log(">>> Inserting a new review (should fire TRIGGER #2: new_review)");
  await Review.create({ paperId: paper._id, reviewerId: reviewer._id, score: 9, comments: "Great work.", recommendation: "accept" });

  console.log("\n>>> Updating paper status to 'published' (should fire TRIGGER #1: paper_published)");
  await Paper.findOneAndUpdate({ _id: paper._id }, { $set: { status: "published" } });

  const notifications = await Notification.find({}).sort({ createdAt: -1 }).limit(5);
  console.log(`\nMost recent notifications created by triggers (${notifications.length}):`);
  notifications.forEach((n) => console.log(` - [${n.type}] ${n.message}`));

  await mongoose.connection.close();
}

main().catch((err) => {
  console.error("Trigger demo failed:", err);
  process.exit(1);
});
