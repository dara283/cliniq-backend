const queueModel = require("../models/queue.model");

const DEFAULT_AVG_CONSULT_MINUTES = 15;

const getAverageConsultationMinutes = async (departmentId) => {
  const historicalAverage = await queueModel.getAverageServiceTime(departmentId);
  if (!historicalAverage || Number.isNaN(Number(historicalAverage))) {
    return DEFAULT_AVG_CONSULT_MINUTES;
  }
  return Math.max(1, Math.round(Number(historicalAverage)));
};

const predictWaitMinutes = (patientsAhead, avgConsultTimeMinutes) => {
  return Math.max(0, Number(patientsAhead) * Number(avgConsultTimeMinutes));
};

module.exports = {
  getAverageConsultationMinutes,
  predictWaitMinutes,
};
