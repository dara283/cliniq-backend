const express = require("express");
const controller = require("../controllers/visit.controller");
const authMiddleware = require("../middleware/auth.middleware");
const { roleMiddleware } = require("../middleware/role.middleware");

const router = express.Router();

// POST /visit/create - create a patient visit/check-in.
router.post("/create", authMiddleware, roleMiddleware("Admin", "Doctor", "Nurse"), controller.createVisit);

// POST /visit/assignDepartment - assign the next department in workflow.
router.post(
  "/assignDepartment",
  authMiddleware,
  roleMiddleware("Admin", "Doctor", "Nurse"),
  controller.assignDepartment
);

// POST /visit/updateStatus - update the visit progress state.
router.post(
  "/updateStatus",
  authMiddleware,
  roleMiddleware("Admin", "Doctor", "Nurse", "Lab", "Radiology", "Pharmacy"),
  controller.updateStatus
);

// GET /visit/:id/path - get department workflow path for a visit.
router.get(
  "/:id/path",
  authMiddleware,
  roleMiddleware("Admin", "Doctor", "Nurse", "Lab", "Radiology", "Pharmacy"),
  controller.getVisitPath
);

module.exports = router;
