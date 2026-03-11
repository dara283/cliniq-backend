const jwt = require("jsonwebtoken");

const signToken = (staff) =>
  jwt.sign(
    {
      staff_id: staff.staff_id,
      email: staff.email,
      role: staff.role,
      department_id: staff.department_id,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
  );

module.exports = {
  signToken,
};
