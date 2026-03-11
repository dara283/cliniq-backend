const express = require("express");
const controller = require("../controllers/clinic.controller");

const router = express.Router();

// GET /clinic/departments - return all hospital departments.
router.get("/departments", controller.getDepartments);

// GET /clinic/buildingMap - return department navigation/building map data.
router.get("/buildingMap", controller.getBuildingMap);

module.exports = router;
