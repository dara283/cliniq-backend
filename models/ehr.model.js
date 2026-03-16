const db = require("../config/db");

const initTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS ehr_notes (
      note_id    SERIAL PRIMARY KEY,
      visit_id   INTEGER NOT NULL UNIQUE REFERENCES visits(visit_id) ON DELETE CASCADE,
      patient_id INTEGER NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
      staff_id   INTEGER REFERENCES staff(staff_id),
      diagnosis  TEXT,
      notes      TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_ehr_notes_patient ON ehr_notes(patient_id);
    CREATE INDEX IF NOT EXISTS idx_ehr_notes_visit   ON ehr_notes(visit_id);
  `);
};

initTable().catch(err => console.error("[EHR] table init failed:", err.message));

const saveNote = async ({ visit_id, patient_id, staff_id, diagnosis, notes }) => {
  const query = `
    INSERT INTO ehr_notes (visit_id, patient_id, staff_id, diagnosis, notes, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    ON CONFLICT (visit_id)
    DO UPDATE SET diagnosis = $4, notes = $5, updated_at = NOW()
    RETURNING *
  `;
  const { rows } = await db.query(query, [visit_id, patient_id, staff_id, diagnosis, notes]);
  return rows[0];
};

const getNoteByVisit = async (visitId) => {
  const query = `
    SELECT
      e.*,
      s.first_name || ' ' || s.last_name AS doctor_name
    FROM ehr_notes e
    LEFT JOIN staff s ON s.staff_id = e.staff_id
    WHERE e.visit_id = $1
    LIMIT 1
  `;
  const { rows } = await db.query(query, [visitId]);
  return rows[0] || null;
};

const getNotesByPatient = async (patientId) => {
  const query = `
    SELECT
      e.*,
      s.first_name || ' ' || s.last_name AS doctor_name,
      v.reason_for_visit,
      v.check_in_time
    FROM ehr_notes e
    LEFT JOIN staff s ON s.staff_id = e.staff_id
    LEFT JOIN visits v ON v.visit_id = e.visit_id
    WHERE e.patient_id = $1
    ORDER BY v.check_in_time DESC
  `;
  const { rows } = await db.query(query, [patientId]);
  return rows;
};

module.exports = { saveNote, getNoteByVisit, getNotesByPatient };
