const express = require("express");
const User = require("../models/User");
const { authRequired } = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");

const router = express.Router();

// SELECT id, name, email, role FROM users  (admin/superadmin only -> DCL)
router.get("/", authRequired, requireRole("admin", "superadmin"), async (req, res) => {
  const users = await User.find({}, { passwordHash: 0 }).sort({ createdAt: -1 });
  res.json(users);
});

// UPDATE users SET role = ? WHERE _id = ?  (superadmin only -> DCL)
router.put("/:id/role", authRequired, requireRole("superadmin"), async (req, res) => {
  const { role } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true, projection: { passwordHash: 0 } });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

// DELETE FROM users WHERE _id = ?  (admin/superadmin only)
router.delete("/:id", authRequired, requireRole("admin", "superadmin"), async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ deleted: true });
});

module.exports = router;
