require('dotenv').config();
const db = require('../config/db');

const patients = [
  { hospital_number: 'HN002', first_name: 'Amara',   last_name: 'Dlamini',  dob: '1985-03-12', gender: 'Female', contact_number: '0711234567', email: 'amara@test.com',   reason: 'Persistent headache and dizziness',    visit_type: 'Walk-in',    department_id: 1, is_emergency: false, is_pregnant: false },
  { hospital_number: 'HN003', first_name: 'Sipho',   last_name: 'Nkosi',    dob: '1972-07-25', gender: 'Male',   contact_number: '0721234567', email: 'sipho@test.com',   reason: 'Chest pain and shortness of breath',   visit_type: 'Walk-in',    department_id: 1, is_emergency: true,  is_pregnant: false },
  { hospital_number: 'HN004', first_name: 'Fatima',  last_name: 'Mokoena',  dob: '1995-11-08', gender: 'Female', contact_number: '0731234567', email: 'fatima@test.com',  reason: 'Routine prenatal checkup',             visit_type: 'Appointment',department_id: 1, is_emergency: false, is_pregnant: true  },
  { hospital_number: 'HN005', first_name: 'Thabo',   last_name: 'Sithole',  dob: '1960-01-30', gender: 'Male',   contact_number: '0741234567', email: 'thabo@test.com',   reason: 'Blood test results follow-up',         visit_type: 'Appointment',department_id: 2, is_emergency: false, is_pregnant: false },
  { hospital_number: 'HN006', first_name: 'Lerato',  last_name: 'Khumalo',  dob: '2000-06-14', gender: 'Female', contact_number: '0751234567', email: 'lerato@test.com',  reason: 'X-ray for suspected fracture',         visit_type: 'Walk-in',    department_id: 3, is_emergency: false, is_pregnant: false },
  { hospital_number: 'HN007', first_name: 'Bongani', last_name: 'Zulu',     dob: '1990-09-03', gender: 'Male',   contact_number: '0761234567', email: 'bongani@test.com', reason: 'Prescription refill',                  visit_type: 'Walk-in',    department_id: 4, is_emergency: false, is_pregnant: false },
  { hospital_number: 'HN008', first_name: 'Nomsa',   last_name: 'Mahlangu', dob: '1955-12-20', gender: 'Female', contact_number: '0771234567', email: 'nomsa@test.com',   reason: 'Diabetes management consultation',     visit_type: 'Appointment',department_id: 1, is_emergency: false, is_pregnant: false },
];

const run = async () => {
  const queueService = require('../services/queue.service');

  for (const p of patients) {
    // Upsert patient
    const { rows: [patient] } = await db.query(`
      INSERT INTO patients (hospital_number, first_name, last_name, dob, gender, contact_number, email)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (hospital_number) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name
      RETURNING patient_id, hospital_number, first_name, last_name
    `, [p.hospital_number, p.first_name, p.last_name, p.dob, p.gender, p.contact_number, p.email]);

    // Create visit
    const { rows: [visit] } = await db.query(`
      INSERT INTO visits (patient_id, reason_for_visit, visit_type, status, check_in_time, priority_score)
      VALUES ($1,$2,$3,'CheckedIn',NOW(),0)
      RETURNING visit_id
    `, [patient.patient_id, p.reason, p.visit_type]);

    // Assign to queue with priority scoring
    const queue = await queueService.assignQueueAutomatically({
      visitId: visit.visit_id,
      departmentId: p.department_id,
      isPregnant: p.is_pregnant,
      isEmergency: p.is_emergency,
    });

    const dept = { 1: 'Consultation', 2: 'Laboratory', 3: 'Radiology', 4: 'Pharmacy' };
    console.log(`✓ ${patient.first_name} ${patient.last_name} (${p.hospital_number}) → ${dept[p.department_id]} | Q#${queue.queue_number} | Wait: ${queue.estimated_wait}min | Emergency: ${p.is_emergency}`);
  }

  await db.pool.end();
  console.log('\n✅ 7 test patients seeded successfully');
};

run().catch(e => { console.error('Seed failed:', e.message); process.exitCode = 1; });
