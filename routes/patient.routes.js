const express = require("express");
const controller = require("../controllers/patient.controller");
const authMiddleware = require("../middleware/auth.middleware");
const { roleMiddleware } = require("../middleware/role.middleware");

const router = express.Router();

// POST /patient/register - create a new patient profile.
router.post("/register", controller.registerPatient);

// GET /patient/:id - get patient profile (staff only medical access).
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("Admin", "Doctor", "Nurse", "Lab", "Radiology", "Pharmacy"),
  controller.getPatientProfile
);

// GET /patient/:id/visits - get patient visit history (staff only medical access).
router.get(
  "/:id/visits",
  authMiddleware,
  roleMiddleware("Admin", "Doctor", "Nurse", "Lab", "Radiology", "Pharmacy"),
  controller.getPatientVisits
);

// POST /patient/uploadResults - upload lab/imaging results for a visit.
router.post(
  "/uploadResults",
  authMiddleware,
  roleMiddleware("Admin", "Doctor", "Nurse", "Lab", "Radiology"),
  controller.uploadPatientResults
);

module.exports = router;
