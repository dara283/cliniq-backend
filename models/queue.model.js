const db = require("../config/db");

const assignQueueNumber = async ({ visit_id, department_id, status, estimated_wait }) => {
  const nextNumberQuery = `
    SELECT COALESCE(MAX(queue_number), 0) + 1 AS next_number
    FROM queue
    WHERE department_id = $1
      AND DATE(assigned_at) = CURRENT_DATE
  `;

  const numberResult = await db.query(nextNumberQuery, [department_id]);
  const nextNumber = numberResult.rows[0].next_number;

  const insertQuery = `
    INSERT INTO queue (
      visit_id,
      department_id,
      queue_number,
      assigned_at,
      status,
      estimated_wait
    )
    VALUES ($1,$2,$3,NOW(),$4,$5)
    RETURNING *
  `;

  const { rows } = await db.query(insertQuery, [
    visit_id,
    department_id,
    nextNumber,
    status || "Waiting",
    estimated_wait || 0,
  ]);

  return rows[0];
};

const getVisitForQueue = async (visitId) => {
  const query = `
    SELECT
      v.visit_id,
      v.visit_type,
      v.check_in_time,
      p.dob
    FROM visits v
    INNER JOIN patients p ON p.patient_id = v.patient_id
    WHERE v.visit_id = $1
    LIMIT 1
  `;
  const { rows } = await db.query(query, [visitId]);
  return rows[0] || null;
};

const getQueueByVisitId = async (visitId) => {
  const query = `
    SELECT
      q.queue_id,
      q.visit_id,
      q.department_id,
      q.queue_number,
      q.queue_priority,
      q.queue_position,
      q.estimated_wait,
      q.status,
      q.checkin_time,
      q.service_start,
      q.service_end,
      q.assigned_at,
      d.name AS department_name
    FROM queue q
    INNER JOIN departments d ON d.dept_id = q.department_id
    WHERE q.visit_id = $1
    ORDER BY q.assigned_at DESC
    LIMIT 1
  `;
  const { rows } = await db.query(query, [visitId]);
  return rows[0] || null;
};

const insertQueueEntry = async ({ visit_id, department_id, queue_priority, checkin_time, status }) => {
  const nextNumberQuery = `
    SELECT COALESCE(MAX(queue_number), 0) + 1 AS next_number
    FROM queue
    WHERE department_id = $1
      AND DATE(assigned_at) = CURRENT_DATE
  `;
  const numberResult = await db.query(nextNumberQuery, [department_id]);
  const nextNumber = numberResult.rows[0].next_number;

  const insertQuery = `
    INSERT INTO queue (
      visit_id,
      department_id,
      queue_number,
      queue_priority,
      queue_position,
      assigned_at,
      checkin_time,
      status,
      estimated_wait
    )
    VALUES ($1,$2,$3,$4,NULL,NOW(),$5,$6,0)
    RETURNING *
  `;
  const { rows } = await db.query(insertQuery, [
    visit_id,
    department_id,
    nextNumber,
    queue_priority,
    checkin_time,
    status || "Waiting",
  ]);
  return rows[0];
};

const rebalanceQueuePositions = async (departmentId) => {
  const activeQuery = `
    SELECT queue_id
    FROM queue
    WHERE department_id = $1
      AND status IN ('Waiting', 'InProgress')
    ORDER BY queue_priority DESC, checkin_time ASC, queue_id ASC
  `;
  const { rows } = await db.query(activeQuery, [departmentId]);

  for (let index = 0; index < rows.length; index += 1) {
    const queueId = rows[index].queue_id;
    const newPosition = index + 1;
    await db.query("UPDATE queue SET queue_position = $2 WHERE queue_id = $1", [queueId, newPosition]);
  }
};

const refreshEstimatedWaitByDepartment = async (departmentId, avgConsultMinutes) => {
  const query = `
    UPDATE queue
    SET estimated_wait = GREATEST(queue_position - 1, 0) * $2
    WHERE department_id = $1
      AND status IN ('Waiting', 'InProgress')
  `;
  await db.query(query, [departmentId, avgConsultMinutes]);
};

const getDepartmentQueue = async (departmentId) => {
  const query = `
    SELECT
      q.queue_id,
      q.visit_id,
      q.department_id,
      q.queue_number,
      q.queue_priority,
      q.queue_position,
      q.estimated_wait,
      q.status,
      q.checkin_time,
      q.service_start,
      q.service_end,
      q.assigned_at,
      d.name AS department_name,
      p.patient_id,
      p.first_name,
      p.last_name
    FROM queue q
    INNER JOIN departments d ON d.dept_id = q.department_id
    INNER JOIN visits v ON v.visit_id = q.visit_id
    INNER JOIN patients p ON p.patient_id = v.patient_id
    WHERE q.department_id = $1
      AND q.status IN ('Waiting', 'InProgress')
    ORDER BY q.queue_position ASC
  `;
  const { rows } = await db.query(query, [departmentId]);
  return rows;
};

const getAverageServiceTime = async (departmentId) => {
  const query = `
    SELECT
      AVG(EXTRACT(EPOCH FROM (service_end - service_start)) / 60.0) AS avg_consult_time
    FROM queue
    WHERE department_id = $1
      AND service_start IS NOT NULL
      AND service_end IS NOT NULL
  `;
  const { rows } = await db.query(query, [departmentId]);
  return rows[0]?.avg_consult_time || null;
};

const updateQueueServiceStateByVisitId = async (visitId, status) => {
  if (status === "InProgress") {
    const query = `
      UPDATE queue
      SET status = 'InProgress',
          service_start = COALESCE(service_start, NOW())
      WHERE visit_id = $1
        AND status IN ('Waiting', 'InProgress')
      RETURNING *
    `;
    const { rows } = await db.query(query, [visitId]);
    return rows[0] || null;
  }

  if (status === "Completed") {
    const query = `
      UPDATE queue
      SET status = 'Completed',
          service_end = COALESCE(service_end, NOW())
      WHERE visit_id = $1
      RETURNING *
    `;
    const { rows } = await db.query(query, [visitId]);
    return rows[0] || null;
  }

  return null;
};

const getQueueStatus = async ({ visit_id, queue_number, department_id }) => {
  const conditions = [];
  const values = [];

  if (visit_id) {
    values.push(visit_id);
    conditions.push(`q.visit_id = $${values.length}`);
  }

  if (queue_number) {
    values.push(queue_number);
    conditions.push(`q.queue_number = $${values.length}`);
  }

  if (department_id) {
    values.push(department_id);
    conditions.push(`q.department_id = $${values.length}`);
  }

  if (!conditions.length) {
    return null;
  }

  const query = `
    SELECT
      q.queue_id,
      q.visit_id,
      q.department_id,
      q.queue_number,
      q.status,
      q.estimated_wait,
      q.assigned_at,
      d.name AS department_name
    FROM queue q
    INNER JOIN departments d ON d.dept_id = q.department_id
    WHERE ${conditions.join(" AND ")}
    ORDER BY q.assigned_at DESC
    LIMIT 1
  `;

  const { rows } = await db.query(query, values);
  return rows[0] || null;
};

module.exports = {
  assignQueueNumber,
  getVisitForQueue,
  getQueueByVisitId,
  insertQueueEntry,
  rebalanceQueuePositions,
  refreshEstimatedWaitByDepartment,
  getDepartmentQueue,
  getAverageServiceTime,
  updateQueueServiceStateByVisitId,
  getQueueStatus,
};
