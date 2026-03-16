require("dotenv").config();

const express = require("express");
const cors = require("cors");

const patientRoutes = require("./routes/patient.routes");
const visitRoutes = require("./routes/visit.routes");
const queueRoutes = require("./routes/queue.routes");
const staffRoutes = require("./routes/staff.routes");
const clinicRoutes = require("./routes/clinic.routes");
const ehrRoutes = require("./routes/ehr.routes");
const { notFound, errorHandler } = require("./middleware/error.middleware");
const { startQueueAutomation } = require("./services/automation.service");
const predictionService = require("./services/prediction.service");
const queueModel = require("./models/queue.model");

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);
app.use(express.json({ limit: "5mb" }));

app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on("finish", () => {
    const elapsedMs = Date.now() - startedAt;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${elapsedMs}ms`
    );
  });
  next();
});

app.get("/", (req, res) => {
  res.status(200).json({ message: "Cliniq API running" });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// AI wait-time prediction endpoint (public)
app.get("/predict/wait/:department_id", async (req, res) => {
  try {
    const deptId = req.params.department_id;
    const queue = await queueModel.getDepartmentQueue(deptId);
    const avgMinutes = await predictionService.getAverageConsultationMinutes(deptId);
    const waiting = queue.filter(q => q.status === 'Waiting').length;
    const predictedWait = predictionService.predictWaitMinutes(waiting, avgMinutes);
    res.json({
      department_id: deptId,
      patients_waiting: waiting,
      avg_consult_minutes: avgMinutes,
      predicted_wait_minutes: predictedWait,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.use("/patient", patientRoutes);
app.use("/visit", visitRoutes);
app.use("/queue", queueRoutes);
app.use("/staff", staffRoutes);
app.use("/clinic", clinicRoutes);
app.use("/ehr", ehrRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`Cliniq backend server listening on port ${PORT}`);
  startQueueAutomation();
});
