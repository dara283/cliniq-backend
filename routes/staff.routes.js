const express = require("express");
const controller = require("../controllers/staff.controller");
const authMiddleware = require("../middleware/auth.middleware");
const { roleMiddleware } = require("../middleware/role.middleware");

const router = express.Router();

// POST /staff/login - authenticate staff and return JWT token.
router.post("/login", controller.login);

// GET /staff/patients - return list of assigned patients for logged-in staff.
router.get(
  "/patients",
  authMiddleware,
  roleMiddleware("Admin", "Doctor", "Nurse", "Lab", "Radiology", "Pharmacy"),
  controller.getAssignedPatients
);

module.exports = router;
