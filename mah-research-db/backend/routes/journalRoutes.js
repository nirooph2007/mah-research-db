const express = require("express");
const mongoose = require("mongoose");
const Journal = require("../models/Journal");
const Paper = require("../models/Paper");
const EditorialAssignment = require("../models/EditorialAssignment");
const { authRequired } = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");
const router = express.Router();
// SELECT * FROM journals  (public)
router.get("/", async (req, res) => {
  const journals = await Journal.find().sort({ createdAt: -1 });
  res.json(journals);
});
// TEMPORARY DEBUG ROUTE — remove after diagnosing the papers $lookup bug
router.get("/debug/paper-types", async (req, res) => {
  const connInfo = {
    connectionName: mongoose.connection.name,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
  };
  const collections = await mongoose.connection.db.listCollections().toArray();
  const collectionCounts = {};
  for (const c of collections) {
    collectionCounts[c.name] = await mongoose.connection.db.collection(c.name).countDocuments();
  }
  const rawPapersViaNativeDriver = await mongoose.connection.db.collection("papers").find({}).toArray();
  const papersViaMongooseModel = await Paper.find({}).lean();
  res.json({
    connInfo,
    collectionCounts,
    rawPapersViaNativeDriver_count: rawPapersViaNativeDriver.length,
    papersViaMongooseModel_count: papersViaMongooseModel.length,
    papersViaMongooseModel_sample: papersViaMongooseModel.slice(0, 2),
  });
});
// JOIN demo: journal + its editorial board + its papers, via $lookup
router.get("/:id/full", async (req, res) => {
  const [result] = await Journal.aggregate([
    { $match: { _id: new (require("mongoose").Types.ObjectId)(req.params.id) } },
    {
      $lookup: {
        from: "editorialassignments",
        localField: "_id",
        foreignField: "journalId",
        as: "board",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "board.userId",
        foreignField: "_id",
        as: "boardUsers",
      },
    },
    {
      $lookup: {
        from: "papers",
        let: { jid: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: [{ $toString: "$journalId" }, { $toString: "$$jid" }] } } },
        ],
        as: "papers",
      },
    },
    {
      $project: {
        "boardUsers.passwordHash": 0,
      },
    },
  ]);
  if (!result) return res.status(404).json({ error: "Journal not found" });
  res.json(result);
});
// INSERT INTO journals ...  (admin/superadmin)
router.post("/", authRequired, requireRole("admin", "superadmin"), async (req, res) => {
  const journal = await Journal.create(req.body);
  res.status(201).json(journal);
});
// UPDATE journals SET ... WHERE _id = ?
router.put("/:id", authRequired, requireRole("admin", "superadmin"), async (req, res) => {
  const journal = await Journal.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!journal) return res.status(404).json({ error: "Journal not found" });
  res.json(journal);
});
// DELETE FROM journals WHERE _id = ?
router.delete("/:id", authRequired, requireRole("superadmin"), async (req, res) => {
  await Journal.findByIdAndDelete(req.params.id);
  await EditorialAssignment.deleteMany({ journalId: req.params.id });
  res.json({ deleted: true });
});
// Editorial board (many-to-many join table) ---------------------------
router.post("/:id/board", authRequired, requireRole("admin", "superadmin"), async (req, res) => {
  const { userId, boardRole } = req.body;
  const assignment = await EditorialAssignment.create({ journalId: req.params.id, userId, boardRole });
  res.status(201).json(assignment);
});
router.get("/:id/board", async (req, res) => {
  const board = await EditorialAssignment.find({ journalId: req.params.id }).populate("userId", "name email role");
  res.json(board);
});
router.delete("/board/:assignmentId", authRequired, requireRole("admin", "superadmin"), async (req, res) => {
  await EditorialAssignment.findByIdAndDelete(req.params.assignmentId);
  res.json({ deleted: true });
});
module.exports = router;
