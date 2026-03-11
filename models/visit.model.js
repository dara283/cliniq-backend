const db = require("../config/db");

const createVisit = async (payload) => {
  const query = `
    INSERT INTO visits (
      patient_id,
      reason_for_visit,
      visit_type,
      status,
      check_in_time,
      priority_score
    )
    VALUES ($1,$2,$3,$4,NOW(),$5)
    RETURNING *
  `;

  const values = [
    payload.patient_id,
    payload.reason_for_visit,
    payload.visit_type,
    payload.status || "CheckedIn",
    payload.priority_score || 0,
  ];

  const { rows } = await db.query(query, values);
  return rows[0];
};

const updateVisitStatus = async (visitId, status, checkOut) => {
  const query = `
    UPDATE visits
    SET status = $2,
        check_out_time = COALESCE($3, check_out_time)
    WHERE visit_id = $1
    RETURNING *
  `;

  const { rows } = await db.query(query, [visitId, status, checkOut]);
  return rows[0] || null;
};

const getVisitPath = async (visitId) => {
  const query = `
    SELECT
      q.queue_id,
      q.queue_number,
      q.assigned_at,
      q.status,
      q.estimated_wait,
      d.dept_id,
      d.name,
      d.floor,
      d.location_description
    FROM queue q
    INNER JOIN departments d ON d.dept_id = q.department_id
    WHERE q.visit_id = $1
    ORDER BY q.assigned_at ASC
  `;

  const { rows } = await db.query(query, [visitId]);
  return rows;
};

module.exports = {
  createVisit,
  updateVisitStatus,
  getVisitPath,
};
