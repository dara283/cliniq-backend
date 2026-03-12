-- Cliniq PostgreSQL / Huawei GaussDB compatible schema

CREATE TABLE IF NOT EXISTS departments (
  dept_id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  category VARCHAR(80) NOT NULL,
  floor VARCHAR(20),
  location_description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patients (
  patient_id BIGSERIAL PRIMARY KEY,
  hospital_number VARCHAR(60) NOT NULL UNIQUE,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  dob DATE NOT NULL,
  gender VARCHAR(20) NOT NULL,
  contact_number VARCHAR(30),
  email VARCHAR(150),
  address TEXT,
  profile_created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  profile_updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff (
  staff_id BIGSERIAL PRIMARY KEY,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(30) NOT NULL CHECK (role IN ('Admin', 'Doctor', 'Nurse', 'Lab', 'Radiology', 'Pharmacy')),
  department_id BIGINT REFERENCES departments(dept_id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS visits (
  visit_id BIGSERIAL PRIMARY KEY,
  patient_id BIGINT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
  reason_for_visit TEXT NOT NULL,
  visit_type VARCHAR(50) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'CheckedIn',
  check_in_time TIMESTAMP NOT NULL DEFAULT NOW(),
  check_out_time TIMESTAMP,
  priority_score INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS queue (
  queue_id BIGSERIAL PRIMARY KEY,
  visit_id BIGINT NOT NULL REFERENCES visits(visit_id) ON DELETE CASCADE,
  department_id BIGINT NOT NULL REFERENCES departments(dept_id),
  queue_number INTEGER NOT NULL,
  queue_priority INTEGER NOT NULL DEFAULT 0,
  queue_position INTEGER,
  assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
  checkin_time TIMESTAMP NOT NULL DEFAULT NOW(),
  service_start TIMESTAMP,
  service_end TIMESTAMP,
  status VARCHAR(30) NOT NULL DEFAULT 'Waiting',
  estimated_wait INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS uploaded_results (
  result_id BIGSERIAL PRIMARY KEY,
  visit_id BIGINT NOT NULL REFERENCES visits(visit_id) ON DELETE CASCADE,
  uploaded_by BIGINT NOT NULL REFERENCES staff(staff_id),
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(60) NOT NULL,
  notes TEXT,
  uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visits_patient_id ON visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_queue_visit_id ON queue(visit_id);
CREATE INDEX IF NOT EXISTS idx_queue_department_id ON queue(department_id);
CREATE INDEX IF NOT EXISTS idx_queue_department_position ON queue(department_id, queue_position);
CREATE INDEX IF NOT EXISTS idx_uploaded_results_visit_id ON uploaded_results(visit_id);

-- Migration-safe alterations for existing deployments
ALTER TABLE queue ADD COLUMN IF NOT EXISTS queue_priority INTEGER NOT NULL DEFAULT 0;
ALTER TABLE queue ADD COLUMN IF NOT EXISTS queue_position INTEGER;
ALTER TABLE queue ADD COLUMN IF NOT EXISTS checkin_time TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE queue ADD COLUMN IF NOT EXISTS service_start TIMESTAMP;
ALTER TABLE queue ADD COLUMN IF NOT EXISTS service_end TIMESTAMP;

-- Optional starter departments
INSERT INTO departments (name, category, floor, location_description)
SELECT v.name, v.category, v.floor, v.location_description
FROM (
  VALUES
    ('Consultation', 'Clinical', '1', 'Main hall near reception'),
    ('Laboratory', 'Diagnostics', '2', 'North wing, room 204'),
    ('Radiology', 'Diagnostics', '2', 'South wing, room 210'),
    ('Pharmacy', 'Medication', '1', 'Ground floor next to exit')
) AS v(name, category, floor, location_description)
WHERE NOT EXISTS (
  SELECT 1 FROM departments d WHERE d.name = v.name
);
