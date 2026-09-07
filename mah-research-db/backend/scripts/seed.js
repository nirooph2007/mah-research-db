/**
 * DML (Data Manipulation Language) demo: INSERT sample rows/documents.
 * Run:  node scripts/seed.js
 * Take a screenshot of the console output for your report ("Data insertion").
 */
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");

const User = require("../models/User");
const Journal = require("../models/Journal");
const EditorialAssignment = require("../models/EditorialAssignment");
const Paper = require("../models/Paper");
const Review = require("../models/Review");
const Notification = require("../models/Notification");

async function main() {
  await connectDB();
  console.log("Clearing existing demo data...");
  await Promise.all([
    User.deleteMany({}),
    Journal.deleteMany({}),
    EditorialAssignment.deleteMany({}),
    Paper.deleteMany({}),
    Review.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  const pw = await bcrypt.hash("Password@123", 10);

  const [superadmin, admin, reviewer, author1, author2] = await User.insertMany([
    { name: "Niroop H", email: "superadmin@mah.tech", passwordHash: pw, role: "superadmin", affiliation: "MAH Institute" },
    { name: "Admin One", email: "admin1@mah.tech", passwordHash: pw, role: "admin", affiliation: "MAH Institute" },
    { name: "Reviewer One", email: "reviewer1@mah.tech", passwordHash: pw, role: "reviewer", affiliation: "MAH Institute" },
    { name: "Asha Rao", email: "asha@student.edu", passwordHash: pw, role: "author", affiliation: "Christ University" },
    { name: "Karan Mehta", email: "karan@student.edu", passwordHash: pw, role: "author", affiliation: "Christ University" },
  ]);
  console.log(`Inserted ${5} users.`);

  const [jais, jqcis] = await Journal.insertMany([
    { title: "Journal of Advanced AI Systems", shortCode: "JAIS", field: "Artificial Intelligence", frequency: "Quarterly" },
    { title: "Journal of Quantum Computing & Intelligent Systems", shortCode: "JQCIS", field: "Quantum Computing", frequency: "Quarterly" },
  ]);
  console.log(`Inserted 2 journals.`);

  await EditorialAssignment.insertMany([
    { journalId: jais._id, userId: superadmin._id, boardRole: "Editor-in-Chief" },
    { journalId: jais._id, userId: admin._id, boardRole: "Associate Editor" },
    { journalId: jqcis._id, userId: admin._id, boardRole: "Editor-in-Chief" },
    { journalId: jqcis._id, userId: reviewer._id, boardRole: "Reviewer" },
  ]);
  console.log("Inserted 4 editorial board assignments.");

  const paper1 = await Paper.create({
    title: "Transformer-Based Anomaly Detection in Edge Networks",
    abstract: "We propose a lightweight transformer architecture for real-time anomaly detection...",
    keywords: ["AI", "Edge Computing", "Transformers"],
    authorId: author1._id,
    journalId: jais._id,
    status: "submitted",
  });

  const paper2 = await Paper.create({
    title: "Hybrid Quantum-Classical Optimization for Logistics",
    abstract: "This paper explores a hybrid QAOA approach applied to vehicle routing problems...",
    keywords: ["Quantum Computing", "Optimization"],
    authorId: author2._id,
    journalId: jqcis._id,
    status: "submitted",
  });
  console.log("Inserted 2 papers.");

  // Inserting a review fires TRIGGER #2 automatically (recomputes avgReviewScore)
  await Review.create({
    paperId: paper1._id,
    reviewerId: reviewer._id,
    score: 8,
    comments: "Solid methodology, needs more baselines.",
    recommendation: "minor_revision",
  });
  console.log("Inserted 1 review (this should have triggered TRIGGER #2 in the console above).");

  console.log("\nSeed complete. Sample login: admin1@mah.tech / Password@123");
  await mongoose.connection.close();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
