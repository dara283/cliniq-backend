require("dotenv").config();

const bcrypt = require("bcryptjs");
const db = require("../config/db");

const seedAdmin = async () => {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@cliniq.local";
  const password = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";
  const firstName = process.env.SEED_ADMIN_FIRST_NAME || "System";
  const lastName = process.env.SEED_ADMIN_LAST_NAME || "Admin";
  const role = process.env.SEED_ADMIN_ROLE || "Admin";
  const departmentId = process.env.SEED_ADMIN_DEPARTMENT_ID || null;

  const passwordHash = await bcrypt.hash(password, 10);

  const query = `
    INSERT INTO staff (
      first_name,
      last_name,
      email,
      password_hash,
      role,
      department_id
    )
    VALUES ($1,$2,$3,$4,$5,$6)
    ON CONFLICT (email)
    DO UPDATE SET
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      password_hash = EXCLUDED.password_hash,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      updated_at = NOW()
    RETURNING staff_id, email, role
  `;

  const { rows } = await db.query(query, [
    firstName,
    lastName,
    email,
    passwordHash,
    role,
    departmentId,
  ]);

  return rows[0];
};

const run = async () => {
  try {
    const admin = await seedAdmin();
    console.log(`Seeded admin user: ${admin.email} (${admin.role})`);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await db.pool.end();
  }
};

run();
