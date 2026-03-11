const queueService = require("../services/queue.service");
const { asyncHandler } = require("../middleware/error.middleware");

const assignQueue = asyncHandler(async (req, res) => {
  const { visit_id, department_id, is_pregnant, is_emergency } = req.body;
  if (!visit_id || !department_id) {
    return res.status(400).json({ message: "visit_id and department_id are required" });
  }

  const queue = await queueService.assignQueueAutomatically({
    visitId: visit_id,
    departmentId: department_id,
    isPregnant: is_pregnant,
    isEmergency: is_emergency,
  });
  return res.status(201).json({ message: "Queue assigned automatically", data: queue });
});

const getDepartmentQueueStatus = asyncHandler(async (req, res) => {
  const { department } = req.params;
  if (!department) {
    return res.status(400).json({ message: "department parameter is required" });
  }

  const queue = await queueService.getDepartmentQueueWithPredictions(department);
  return res.status(200).json({ department_id: Number(department), queue });
});

const getPatientQueueStatus = asyncHandler(async (req, res) => {
  const { visit_id } = req.params;
  const queueStatus = await queueService.getPatientQueueStatus(visit_id);
  if (!queueStatus) {
    return res.status(404).json({ message: "Patient queue status not found" });
  }

  return res.status(200).json({
    visit_id: Number(visit_id),
    queue_position: queueStatus.queue_position,
    queue_priority: queueStatus.queue_priority,
    estimated_wait_minutes: queueStatus.estimated_wait,
    department_id: queueStatus.department_id,
    department_name: queueStatus.department_name,
    status: queueStatus.status,
  });
});

const streamDepartmentQueue = asyncHandler(async (req, res) => {
  const { department } = req.params;
  if (!department) {
    return res.status(400).json({ message: "department parameter is required" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const pushUpdate = async () => {
    try {
      const queue = await queueService.getDepartmentQueueWithPredictions(department);
      res.write(`data: ${JSON.stringify({ department_id: Number(department), queue })}\n\n`);
    } catch (error) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: error.message })}\n\n`);
    }
  };

  await pushUpdate();
  const intervalId = setInterval(pushUpdate, 5000);

  req.on("close", () => {
    clearInterval(intervalId);
    res.end();
  });
});

module.exports = {
  assignQueue,
  getDepartmentQueueStatus,
  getPatientQueueStatus,
  streamDepartmentQueue,
};
