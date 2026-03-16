const ehrModel = require("../models/ehr.model");
const { asyncHandler } = require("../middleware/error.middleware");

const saveNote = asyncHandler(async (req, res) => {
  const { visit_id, patient_id, diagnosis, notes } = req.body;
  if (!visit_id || !patient_id) {
    return res.status(400).json({ message: "visit_id and patient_id are required" });
  }
  const note = await ehrModel.saveNote({
    visit_id,
    patient_id,
    staff_id: req.user.staff_id,
    diagnosis,
    notes,
  });
  return res.status(200).json({ message: "Note saved", data: note });
});

const getNoteByVisit = asyncHandler(async (req, res) => {
  const note = await ehrModel.getNoteByVisit(req.params.visit_id);
  return res.status(200).json(note || null);
});

const getNotesByPatient = asyncHandler(async (req, res) => {
  const notes = await ehrModel.getNotesByPatient(req.params.patient_id);
  return res.status(200).json(notes);
});

module.exports = { saveNote, getNoteByVisit, getNotesByPatient };
