const mongoose = require("mongoose");

// ---- "Table": notifications ----
// Rows in this collection are created automatically by TRIGGERS
// (see middleware/triggers.js), not directly by API calls -- this is what
// you demo live to show "trigger execution" for the report.
const notificationSchema = new mongoose.Schema(
  {
    // FK -> users._id (recipient)
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ["paper_published", "new_review", "status_change"], required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
