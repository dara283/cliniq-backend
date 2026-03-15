require("dotenv").config();

const baseUrl = process.env.HEALTHCHECK_BASE_URL || "http://localhost:3000";
const testEmail = process.env.HEALTHCHECK_EMAIL || null;
const testPassword = process.env.HEALTHCHECK_PASSWORD || null;

const request = async (path, options = {}) => {
  const res = await fetch(`${baseUrl}${path}`, options);
  const text = await res.text();
  let body = text;
  try {
    body = JSON.parse(text);
  } catch (_) {}
  return { status: res.status, body };
};

const run = async () => {
  console.log(`Healthcheck base URL: ${baseUrl}`);

  const health = await request("/health");
  console.log("GET /health", health.status, health.body);

  const departments = await request("/clinic/departments");
  console.log("GET /clinic/departments", departments.status);

  if (testEmail && testPassword) {
    const login = await request("/staff/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    console.log("POST /staff/login", login.status);

    const token = login.body?.token;
    if (token) {
      const patients = await request("/staff/patients", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("GET /staff/patients", patients.status);
    } else {
      console.log("No token returned, skipping /staff/patients");
    }
  } else {
    console.log("HEALTHCHECK_EMAIL/HEALTHCHECK_PASSWORD not set, skipping auth checks");
  }
};

run().catch((err) => {
  console.error("Healthcheck failed:", err.message);
  process.exitCode = 1;
});
