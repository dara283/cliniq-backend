const bcrypt = require("bcryptjs");
const staffModel = require("../models/staff.model");
const { signToken } = require("../utils/token");
const { asyncHandler } = require("../middleware/error.middleware");

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }

  const staff = await staffModel.getStaffByEmail(email);
  if (!staff) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, staff.password_hash);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signToken(staff);
  return res.status(200).json({
    message: "Login successful",
    token,
    staff: {
      staff_id: staff.staff_id,
      first_name: staff.first_name,
      last_name: staff.last_name,
      email: staff.email,
      role: staff.role,
      department_id: staff.department_id,
    },
  });
});

const getAssignedPatients = asyncHandler(async (req, res) => {
  const patients = await staffModel.getAssignedPatients(req.user.staff_id);
  return res.status(200).json({ data: patients });
});

module.exports = {
  login,
  getAssignedPatients,
};
