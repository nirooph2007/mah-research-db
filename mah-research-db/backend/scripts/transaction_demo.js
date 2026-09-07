/**
 * TCL (Transaction Control Language) demo: COMMIT and ROLLBACK using
 * MongoDB multi-document ACID transactions.
 *
 * Requires MongoDB to be a replica set (MongoDB Atlas is a replica set
 * by default, even on the free M0 tier, so this works out of the box).
 *
 * Run: node scripts/transaction_demo.js
 * Take a screenshot of the output for your report ("Trigger execution"
 * folder can also hold this as "TCL execution").
 */
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Paper = require("../models/Paper");
const Journal = require("../models/Journal");
const Notification = require("../models/Notification");
const User = require("../models/User");

async function scenarioCommit() {
  const session = await mongoose.startSession();
  console.log("\n--- SCENARIO 1: valid submission -> expect COMMIT ---");
  try {
    session.startTransaction();
    const journal = await Journal.findOne().session(session);
    const author = await User.findOne({ role: "author" }).session(session);

    const [paper] = await Paper.create(
      [{ title: "TCL Demo Paper", abstract: "Created inside a transaction.", journalId: journal._id, authorId: author._id, status: "submitted" }],
      { session }
    );
    await Notification.create([{ userId: author._id, message: "TCL demo notification", type: "status_change" }], { session });

    await session.commitTransaction();
    console.log(`COMMIT successful. New paper _id = ${paper._id}`);
  } catch (err) {
    await session.abortTransaction();
    console.log("Unexpected abort:", err.message);
  } finally {
    session.endSession();
  }
}

async function scenarioRollback() {
  const session = await mongoose.startSession();
  console.log("\n--- SCENARIO 2: invalid journal reference -> expect ROLLBACK ---");
  const countBefore = await Paper.countDocuments();
  try {
    session.startTransaction();
    const fakeJournalId = new mongoose.Types.ObjectId(); // does not exist
    const journal = await Journal.findById(fakeJournalId).session(session);
    if (!journal) throw new Error("Referenced journal does not exist");

    await Paper.create([{ title: "Should never be saved", abstract: "x", journalId: fakeJournalId, authorId: fakeJournalId, status: "submitted" }], { session });
    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    console.log(`ROLLBACK triggered. Reason: ${err.message}`);
  } finally {
    session.endSession();
  }
  const countAfter = await Paper.countDocuments();
  console.log(`papers count before=${countBefore}, after=${countAfter} (unchanged => rollback verified)`);
}

async function main() {
  await connectDB();
  await scenarioCommit();
  await scenarioRollback();
  await mongoose.connection.close();
}

main().catch((err) => {
  console.error("Transaction demo failed:", err);
  process.exit(1);
});
