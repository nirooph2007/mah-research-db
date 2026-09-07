const mongoose = require("mongoose");

// ---- "Table": editorial_assignments ----
// This is a classic many-to-many JOIN table: one journal can have many
// editors/reviewers, and one user can be assigned to many journals.
const editorialAssignmentSchema = new mongoose.Schema(
  {
    // FK -> journals._id
    journalId: { type: mongoose.Schema.Types.ObjectId, ref: "Journal", required: true },
    // FK -> users._id
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    boardRole: {
      type: String,
      enum: ["Editor-in-Chief", "Associate Editor", "Reviewer"],
      required: true,
    },
  },
  { timestamps: true }
);

editorialAssignmentSchema.index({ journalId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("EditorialAssignment", editorialAssignmentSchema);
