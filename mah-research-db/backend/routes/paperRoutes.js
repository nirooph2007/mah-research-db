const express = require("express");
const mongoose = require("mongoose");
const Paper = require("../models/Paper");
const Journal = require("../models/Journal");
const Notification = require("../models/Notification");
const { authRequired } = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");

const router = express.Router();

// SELECT * FROM papers [WHERE journalId = ?] [WHERE status = ?]
router.get("/", async (req, res) => {
  const filter = {};
  if (req.query.journalId) filter.journalId = req.query.journalId;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.authorId) filter.authorId = req.query.authorId;
  const papers = await Paper.find(filter)
    .populate("authorId", "name email")
    .populate("journalId", "title shortCode")
    .sort({ createdAt: -1 });
  res.json(papers);
});

router.get("/:id", async (req, res) => {
  const paper = await Paper.findById(req.params.id)
    .populate("authorId", "name email")
    .populate("journalId", "title shortCode");
  if (!paper) return res.status(404).json({ error: "Paper not found" });
  res.json(paper);
});

// =====================================================================
// TCL DEMO: submitting a paper is wrapped in a MongoDB multi-document
// ACID transaction (session.startTransaction / commitTransaction /
// abortTransaction) -- equivalent to SQL BEGIN / COMMIT / ROLLBACK.
// We check the journal exists INSIDE the transaction; if it doesn't,
// we abort and NOTHING is written (atomic all-or-nothing).
// =====================================================================
router.post("/", authRequired, requireRole("author", "admin", "superadmin"), async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { title, abstract, keywords, journalId } = req.body;

    const journal = await Journal.findById(journalId).session(session);
    if (!journal) {
      throw new Error("Journal not found - rolling back");
    }

    const [paper] = await Paper.create(
      [{ title, abstract, keywords, journalId, authorId: req.user.id, status: "submitted" }],
      { session }
    );

    await Notification.create(
      [{ userId: req.user.id, message: `Your paper "${title}" was submitted to ${journal.title}.`, type: "status_change" }],
      { session }
    );

    await session.commitTransaction();
    console.log(`[TCL] Transaction committed for new paper ${paper._id}`);
    res.status(201).json(paper);
  } catch (err) {
    await session.abortTransaction();
    console.log(`[TCL] Transaction rolled back: ${err.message}`);
    res.status(400).json({ error: err.message });
  } finally {
    session.endSession();
  }
});

// UPDATE papers SET status = ? WHERE _id = ?   -> fires TRIGGER #1 when status='published'
router.put("/:id/status", authRequired, requireRole("admin", "superadmin"), async (req, res) => {
  const { status } = req.body;
  const paper = await Paper.findOneAndUpdate(
    { _id: req.params.id },
    { $set: { status } },
    { new: true }
  );
  if (!paper) return res.status(404).json({ error: "Paper not found" });
  res.json(paper);
});

router.put("/:id", authRequired, async (req, res) => {
  const paper = await Paper.findById(req.params.id);
  if (!paper) return res.status(404).json({ error: "Paper not found" });
  if (String(paper.authorId) !== req.user.id && !["admin", "superadmin"].includes(req.user.role)) {
    return res.status(403).json({ error: "Not allowed" });
  }
  Object.assign(paper, req.body);
  await paper.save();
  res.json(paper);
});

router.delete("/:id", authRequired, requireRole("admin", "superadmin"), async (req, res) => {
  await Paper.findByIdAndDelete(req.params.id);
  res.json({ deleted: true });
});

module.exports = router;
