const jwt = require("jsonwebtoken");
const staffModel = require("../models/staff.model");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid authorization header" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const staff = await staffModel.getStaffById(decoded.staff_id);

    if (!staff) {
      return res.status(401).json({ message: "Invalid token subject" });
    }

    req.user = {
      staff_id: staff.staff_id,
      email: staff.email,
      role: staff.role,
      department_id: staff.department_id,
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized", details: error.message });
  }
};

module.exports = authMiddleware;
