const express = require("express");
const controller = require("../controllers/ehr.controller");
const authMiddleware = require("../middleware/auth.middleware");
const { roleMiddleware } = require("../middleware/role.middleware");

const router = express.Router();

const medicalRoles = ["Admin", "Doctor", "Nurse", "Lab", "Radiology", "Pharmacy"];

// POST /ehr/notes - save or update clinical note for a visit
router.post("/notes", authMiddleware, roleMiddleware(...medicalRoles), controller.saveNote);

// GET /ehr/visit/:visit_id - get note for a specific visit
router.get("/visit/:visit_id", authMiddleware, roleMiddleware(...medicalRoles), controller.getNoteByVisit);

// GET /ehr/patient/:patient_id - get full EHR history for a patient
router.get("/patient/:patient_id", authMiddleware, roleMiddleware(...medicalRoles), controller.getNotesByPatient);

module.exports = router;
