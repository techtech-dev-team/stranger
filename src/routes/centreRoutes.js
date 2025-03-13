const express = require("express");
const { getAllCentres, getCentreById, getInactiveCentres , getActiveCentres } = require("../controllers/centreController");

const router = express.Router();

router.get("/", getAllCentres);
router.get("/:id", getCentreById);
router.get("/inactive/list", getInactiveCentres);
router.get("/active/list", getActiveCentres);


module.exports = router;
