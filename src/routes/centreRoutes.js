const express = require("express");
const { getAllCentres, getCentreById , getInactiveCentres} = require("../controllers/centreController");

const router = express.Router();

router.get("/", getAllCentres);
router.get("/:id", getCentreById);
router.get("/inactive", getInactiveCentres);


module.exports = router;
