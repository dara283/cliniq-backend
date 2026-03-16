const queueModel = require('../models/queue.model');

const DEFAULT_AVG_CONSULT_MINUTES = 15;

// Peak hour multipliers (higher = busier = longer waits)
const getTimeOfDayFactor = () => {
  const hour = new Date().getHours();
  if (hour >= 8 && hour < 10) return 1.4;   // Morning rush
  if (hour >= 10 && hour < 12) return 1.2;  // Mid morning
  if (hour >= 12 && hour < 14) return 1.3;  // Lunch rush
  if (hour >= 14 && hour < 16) return 1.1;  // Afternoon
  if (hour >= 16 && hour < 18) return 1.3;  // End of day rush
  return 1.0;
};

// Monday and Friday tend to be busier
const getDayOfWeekFactor = () => {
  const day = new Date().getDay();
  if (day === 1 || day === 5) return 1.2;
  if (day === 0 || day === 6) return 0.7; // Weekend
  return 1.0;
};

const getAverageConsultationMinutes = async (departmentId) => {
  const historical = await queueModel.getAverageServiceTime(departmentId);
  const base = (!historical || isNaN(Number(historical)))
    ? DEFAULT_AVG_CONSULT_MINUTES
    : Math.max(1, Math.round(Number(historical)));

  const adjusted = base * getTimeOfDayFactor() * getDayOfWeekFactor();
  return Math.round(adjusted);
};

const predictWaitMinutes = (patientsAhead, avgConsultTimeMinutes) => {
  return Math.max(0, Number(patientsAhead) * Number(avgConsultTimeMinutes));
};

module.exports = {
  getAverageConsultationMinutes,
  predictWaitMinutes,
};
