// =====================================================================
// DCL (Data Control Language) equivalent.
// In SQL you would write:  GRANT DELETE ON papers TO 'admin'@'%';
// MongoDB has no per-collection GRANT/REVOKE inside a single free-tier
// deployment for an app, so we enforce the same "who is allowed to do
// what" contract at the application boundary. Roles map to Atlas
// database-user roles when deployed with separate DB users (see
// docs/DBMS_CONCEPTS_MAPPING.md for the Atlas-side GRANT/REVOKE too).
// =====================================================================
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Role '${req.user.role}' is not permitted. Required: ${allowedRoles.join(", ")}`,
      });
    }
    next();
  };
}

module.exports = { requireRole };
