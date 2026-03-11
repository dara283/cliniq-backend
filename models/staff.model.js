const db = require("../config/db");

const getStaffByEmail = async (email) => {
  const { rows } = await db.query(
    "SELECT * FROM staff WHERE LOWER(email) = LOWER($1) LIMIT 1",
    [email]
  );
  return rows[0] || null;
};

const getStaffById = async (staffId) => {
  const { rows } = await db.query("SELECT * FROM staff WHERE staff_id = $1", [staffId]);
  return rows[0] || null;
};

const getAssignedPatients = async (staffId) => {
  const staff = await getStaffById(staffId);
  if (!staff || !staff.department_id) {
    return [];
  }

  const query = `
    SELECT DISTINCT
      p.patient_id,
      p.hospital_number,
      p.first_name,
      p.last_name,
      p.contact_number,
      v.visit_id,
      v.status AS visit_status,
      v.reason_for_visit,
      q.queue_number,
      q.status AS queue_status,
      q.estimated_wait
    FROM queue q
    INNER JOIN visits v ON v.visit_id = q.visit_id
    INNER JOIN patients p ON p.patient_id = v.patient_id
    WHERE q.department_id = $1
      AND q.status IN ('Waiting', 'InProgress')
    ORDER BY q.queue_number ASC
  `;

  const { rows } = await db.query(query, [staff.department_id]);
  return rows;
};

module.exports = {
  getStaffByEmail,
  getStaffById,
  getAssignedPatients,
};
