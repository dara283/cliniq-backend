const patientModel = require("../models/patient.model");
const { asyncHandler } = require("../middleware/error.middleware");

const selfCheckIn = asyncHandler(async (req, res) => {
  const required = ['patient_id', 'reason_for_visit', 'visit_type'];
  const missing = required.filter((f) => !req.body[f]);
  if (missing.length) {
    return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });
  }
  const visitModel = require('../models/visit.model');
  const queueService = require('../services/queue.service');
  const visit = await visitModel.createVisit({
    patient_id: req.body.patient_id,
    reason_for_visit: req.body.reason_for_visit,
    visit_type: req.body.visit_type,
    department_id: 1,
  });
  const queue = await queueService.assignQueueAutomatically({
    visitId: visit.visit_id,
    departmentId: 1,
    isPregnant: req.body.is_pregnant || false,
    isEmergency: req.body.is_emergency || false,
  });
  return res.status(201).json({ message: 'Checked in successfully', data: { visit, queue } });
});

const registerPatient = asyncHandler(async (req, res) => {
  const required = ["hospital_number", "first_name", "last_name", "dob", "gender"];
  const missing = required.filter((field) => !req.body[field]);

  if (missing.length) {
    return res.status(400).json({ message: `Missing required fields: ${missing.join(", ")}` });
  }

  const patient = await patientModel.createPatient(req.body);
  return res.status(201).json({ message: "Patient profile created", data: patient });
});

const getPatientProfile = asyncHandler(async (req, res) => {
  const patient = await patientModel.getPatientById(req.params.id);
  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }

  return res.status(200).json({ data: patient });
});

const getPatientVisits = asyncHandler(async (req, res) => {
  const visits = await patientModel.getVisitHistoryByPatientId(req.params.id);
  return res.status(200).json({ data: visits });
});

const uploadPatientResults = asyncHandler(async (req, res) => {
  const required = ["visit_id", "file_name", "file_url", "file_type"];
  const missing = required.filter((field) => !req.body[field]);

  if (missing.length) {
    return res.status(400).json({ message: `Missing required fields: ${missing.join(", ")}` });
  }

  const payload = {
    ...req.body,
    uploaded_by: req.user.staff_id,
  };

  const result = await patientModel.uploadResult(payload);
  return res.status(201).json({ message: "Document uploaded", data: result });
});

const lookupPatient = asyncHandler(async (req, res) => {
  const patient = await patientModel.getPatientByHospitalNumber(req.params.hospital_number);
  if (!patient) return res.status(404).json({ message: 'Patient not found' });
  return res.status(200).json({ data: patient });
});

module.exports = {
  registerPatient,
  selfCheckIn,
  lookupPatient,
  getPatientProfile,
  getPatientVisits,
  uploadPatientResults,
};
