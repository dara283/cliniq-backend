const patientModel = require("../models/patient.model");
const { asyncHandler } = require("../middleware/error.middleware");

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

module.exports = {
  registerPatient,
  getPatientProfile,
  getPatientVisits,
  uploadPatientResults,
};
