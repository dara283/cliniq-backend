require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

const staff = [
  { first_name: 'John', last_name: 'Doctor', email: 'doctor@cliniq.local', role: 'Doctor' },
  { first_name: 'Jane', last_name: 'Nurse', email: 'nurse@cliniq.local', role: 'Nurse' },
];

const run = async () => {
  const hash = await bcrypt.hash('admin123', 10);
  for (const s of staff) {
    const { rows } = await db.query(
      `INSERT INTO staff (first_name, last_name, email, password_hash, role, department_id)
       VALUES ($1,$2,$3,$4,$5,null)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING email, role`,
      [s.first_name, s.last_name, s.email, hash, s.role]
    );
    console.log(`Seeded: ${rows[0].email} (${rows[0].role})`);
  }
  await db.pool.end();
};

run().catch(e => { console.error(e.message); process.exitCode = 1; });
