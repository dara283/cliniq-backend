const visitModel = require("../models/visit.model");
const queueModel = require("../models/queue.model");
const queueService = require("../services/queue.service");
const { asyncHandler } = require("../middleware/error.middleware");

const createVisit = asyncHandler(async (req, res) => {
  const required = ["patient_id", "reason_for_visit", "visit_type", "department_id"];
  const missing = required.filter((field) => !req.body[field]);

  if (missing.length) {
    return res.status(400).json({ message: `Missing required fields: ${missing.join(", ")}` });
  }

  const visit = await visitModel.createVisit(req.body);
  const queueAssignment = await queueService.assignQueueAutomatically({
    visitId: visit.visit_id,
    departmentId: req.body.department_id,
    isPregnant: req.body.is_pregnant,
    isEmergency: req.body.is_emergency,
  });

  return res.status(201).json({
    message: "Visit created and queued",
    data: {
      visit,
      queue: queueAssignment,
    },
  });
});

const assignDepartment = asyncHandler(async (req, res) => {
  const required = ["visit_id", "department_id"];
  const missing = required.filter((field) => !req.body[field]);

  if (missing.length) {
    return res.status(400).json({ message: `Missing required fields: ${missing.join(", ")}` });
  }

  const queueEntry = await queueService.referToDepartment({
    visitId: req.body.visit_id,
    departmentId: req.body.department_id,
    isPregnant: req.body.is_pregnant,
    isEmergency: req.body.is_emergency,
  });
  return res.status(201).json({ message: "Department assigned", data: queueEntry });
});

const updateStatus = asyncHandler(async (req, res) => {
  const { visit_id, status } = req.body;
  if (!visit_id || !status) {
    return res.status(400).json({ message: "visit_id and status are required" });
  }

  const checkOut = status === "Completed" ? new Date() : null;
  const visit = await visitModel.updateVisitStatus(visit_id, status, checkOut);
  if (!visit) {
    return res.status(404).json({ message: "Visit not found" });
  }

  await queueModel.updateQueueServiceStateByVisitId(visit_id, status);
  const queueRecord = await queueModel.getQueueByVisitId(visit_id);
  if (queueRecord) {
    await queueService.refreshQueueStateForDepartment(queueRecord.department_id);
  }

  return res.status(200).json({ message: "Visit status updated", data: visit });
});

const getVisitPath = asyncHandler(async (req, res) => {
  const path = await visitModel.getVisitPath(req.params.id);
  return res.status(200).json({ data: path });
});

module.exports = {
  createVisit,
  assignDepartment,
  updateStatus,
  getVisitPath,
};
