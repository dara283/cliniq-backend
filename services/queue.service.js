const queueModel = require("../models/queue.model");
const predictionService = require("./prediction.service");

const AGE_THRESHOLD_ELDERLY = 65;

const yearsBetween = (fromDate, toDate = new Date()) => {
  const from = new Date(fromDate);
  let years = toDate.getFullYear() - from.getFullYear();
  const monthDelta = toDate.getMonth() - from.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && toDate.getDate() < from.getDate())) {
    years -= 1;
  }
  return years;
};

const calculatePriority = ({ visitType, dob, isPregnant, isEmergency }) => {
  let score = 0;

  score += String(visitType).toLowerCase() === "appointment" ? 2 : 1;

  if (dob && yearsBetween(dob) > AGE_THRESHOLD_ELDERLY) {
    score += 2;
  }

  if (Boolean(isPregnant)) {
    score += 3;
  }

  if (Boolean(isEmergency)) {
    score += 5;
  }

  return score;
};

const refreshQueueStateForDepartment = async (departmentId) => {
  await queueModel.rebalanceQueuePositions(departmentId);
  const averageConsultMinutes = await predictionService.getAverageConsultationMinutes(departmentId);
  await queueModel.refreshEstimatedWaitByDepartment(departmentId, averageConsultMinutes);
  return averageConsultMinutes;
};

const assignQueueAutomatically = async ({
  visitId,
  departmentId,
  isPregnant = false,
  isEmergency = false,
}) => {
  const alreadyQueued = await queueModel.getQueueByVisitId(visitId);
  if (alreadyQueued) {
    await refreshQueueStateForDepartment(departmentId);
    return queueModel.getQueueByVisitId(visitId);
  }

  const visit = await queueModel.getVisitForQueue(visitId);
  if (!visit) {
    const error = new Error("Visit not found");
    error.statusCode = 404;
    throw error;
  }

  const priority = calculatePriority({
    visitType: visit.visit_type,
    dob: visit.dob,
    isPregnant,
    isEmergency,
  });

  await queueModel.insertQueueEntry({
    visit_id: visitId,
    department_id: departmentId,
    queue_priority: priority,
    checkin_time: visit.check_in_time || new Date(),
    status: "Waiting",
  });

  await refreshQueueStateForDepartment(departmentId);
  return queueModel.getQueueByVisitId(visitId);
};

const getDepartmentQueueWithPredictions = async (departmentId) => {
  await refreshQueueStateForDepartment(departmentId);
  return queueModel.getDepartmentQueue(departmentId);
};

const getPatientQueueStatus = async (visitId) => {
  const record = await queueModel.getQueueByVisitId(visitId);
  if (!record) {
    return null;
  }

  await refreshQueueStateForDepartment(record.department_id);
  return queueModel.getQueueByVisitId(visitId);
};

module.exports = {
  assignQueueAutomatically,
  getDepartmentQueueWithPredictions,
  getPatientQueueStatus,
  refreshQueueStateForDepartment,
};
