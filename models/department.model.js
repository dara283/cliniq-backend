const db = require("../config/db");

const getAllDepartments = async () => {
  const { rows } = await db.query(
    "SELECT dept_id, name, category, floor, location_description FROM departments ORDER BY name ASC"
  );
  return rows;
};

const getBuildingMap = async () => {
  const { rows } = await db.query(
    "SELECT dept_id, name, floor, location_description FROM departments ORDER BY floor ASC, name ASC"
  );
  return rows;
};

module.exports = {
  getAllDepartments,
  getBuildingMap,
};
