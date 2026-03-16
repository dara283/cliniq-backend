const db = require("../config/db");

const createPatient = async (payload) => {
  const query = `
    INSERT INTO patients (
      hospital_number,
      first_name,
      last_name,
      dob,
      gender,
      contact_number,
      email,
      address
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *
  `;

  const values = [
    payload.hospital_number,
    payload.first_name,
    payload.last_name,
    payload.dob,
    payload.gender,
    payload.contact_number,
    payload.email,
    payload.address,
  ];

  const { rows } = await db.query(query, values);
  return rows[0];
};

const getPatientById = async (patientId) => {
  const { rows } = await db.query("SELECT * FROM patients WHERE patient_id = $1", [patientId]);
  return rows[0] || null;
};

const getPatientByHospitalNumber = async (hospitalNumber) => {
  const { rows } = await db.query(
    "SELECT * FROM patients WHERE UPPER(hospital_number) = UPPER($1) LIMIT 1",
    [hospitalNumber]
  );
  return rows[0] || null;
};

const getVisitHistoryByPatientId = async (patientId) => {
  const query = `
    SELECT
      v.visit_id,
      v.reason_for_visit,
      v.visit_type,
      v.status,
      v.check_in_time,
      v.check_out_time,
      v.priority_score,
      q.queue_number,
      q.estimated_wait,
      d.name AS department_name
    FROM visits v
    LEFT JOIN queue q ON q.visit_id = v.visit_id
    LEFT JOIN departments d ON d.dept_id = q.department_id
    WHERE v.patient_id = $1
    ORDER BY v.check_in_time DESC
  `;

  const { rows } = await db.query(query, [patientId]);
  return rows;
};

const uploadResult = async (payload) => {
  const query = `
    INSERT INTO uploaded_results (
      visit_id,
      uploaded_by,
      file_name,
      file_url,
      file_type,
      notes
    )
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *
  `;

  const values = [
    payload.visit_id,
    payload.uploaded_by,
    payload.file_name,
    payload.file_url,
    payload.file_type,
    payload.notes,
  ];

  const { rows } = await db.query(query, values);
  return rows[0];
};

module.exports = {
  createPatient,
  getPatientById,
  getPatientByHospitalNumber,
  getVisitHistoryByPatientId,
  uploadResult,
};
