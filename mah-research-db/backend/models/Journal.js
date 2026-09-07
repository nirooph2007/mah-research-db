const mongoose = require("mongoose");

// ---- "Table": journals ----
const journalSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    shortCode: { type: String, required: true, unique: true, uppercase: true },
    field: { type: String, required: true },
    frequency: { type: String, enum: ["Monthly", "Quarterly", "Biannual", "Annual"], default: "Quarterly" },
    issn: { type: String, default: "Pending Assignment" },
    description: { type: String, default: "" },
    // FK-style reference -> users._id (editors assigned to this journal)
    editorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Journal", journalSchema);
