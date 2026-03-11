const express = require("express");
const controller = require("../controllers/queue.controller");
const authMiddleware = require("../middleware/auth.middleware");
const { roleMiddleware } = require("../middleware/role.middleware");

const router = express.Router();

// POST /queue/assign - assign queue number for department flow.
router.post(
  "/assign",
  authMiddleware,
  roleMiddleware("Admin", "Doctor", "Nurse", "Lab", "Radiology", "Pharmacy"),
  controller.assignQueue
);

// GET /queue/status/:department - return current ordered queue for department.
router.get(
  "/status/:department",
  authMiddleware,
  roleMiddleware("Admin", "Doctor", "Nurse", "Lab", "Radiology", "Pharmacy"),
  controller.getDepartmentQueueStatus
);

// GET /queue/stream/:department - real-time queue updates using SSE.
router.get(
  "/stream/:department",
  authMiddleware,
  roleMiddleware("Admin", "Doctor", "Nurse", "Lab", "Radiology", "Pharmacy"),
  controller.streamDepartmentQueue
);

// GET /queue/patient/:visit_id - public patient queue lookup.
router.get("/patient/:visit_id", controller.getPatientQueueStatus);

module.exports = router;
