require('dotenv').config();
const db = require('../config/db');

const run = async () => {
  // Insert test patient
  const { rows: [patient] } = await db.query(`
    INSERT INTO patients (hospital_number, first_name, last_name, dob, gender, contact_number, email)
    VALUES ('HN001', 'Test', 'Patient', '1990-01-01', 'Male', '0821234567', 'patient@cliniq.local')
    ON CONFLICT (hospital_number) DO UPDATE SET first_name = EXCLUDED.first_name
    RETURNING patient_id, hospital_number, first_name, last_name
  `);
  console.log('Patient:', patient);

  // Insert test visit
  const { rows: [visit] } = await db.query(`
    INSERT INTO visits (patient_id, reason_for_visit, visit_type, status, check_in_time)
    VALUES ($1, 'General checkup', 'Walk-in', 'Pending', NOW())
    RETURNING visit_id, status
  `, [patient.patient_id]);
  console.log('Visit:', visit);

  // Assign to queue (department_id 1 = Consultation)
  const { rows: [queue] } = await db.query(`
    INSERT INTO queue (visit_id, department_id, queue_number, queue_priority, status, estimated_wait, assigned_at, checkin_time)
    VALUES ($1, 1, 1, 0, 'Waiting', 15, NOW(), NOW())
    RETURNING queue_number, estimated_wait, status
  `, [visit.visit_id]);
  console.log('Queue:', queue);
  console.log(`\nTest with Visit ID: ${visit.visit_id}`);

  await db.pool.end();
};

run().catch(e => { console.error(e.message); process.exitCode = 1; });
