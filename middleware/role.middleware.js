const VALID_ROLES = ["Admin", "Doctor", "Nurse", "Lab", "Radiology", "Pharmacy"];

const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!VALID_ROLES.includes(req.user.role)) {
      return res.status(403).json({ message: "Role is not recognized" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    }

    return next();
  };
};

module.exports = {
  VALID_ROLES,
  roleMiddleware,
};
