const departmentModel = require("../models/department.model");
const { asyncHandler } = require("../middleware/error.middleware");

const getDepartments = asyncHandler(async (req, res) => {
  const departments = await departmentModel.getAllDepartments();
  return res.status(200).json({ data: departments });
});

const getBuildingMap = asyncHandler(async (req, res) => {
  const map = await departmentModel.getBuildingMap();
  return res.status(200).json({ data: map });
});

module.exports = {
  getDepartments,
  getBuildingMap,
};
