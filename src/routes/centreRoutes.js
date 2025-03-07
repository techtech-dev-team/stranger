const express = require("express");
const { getAllCentres, getCentreById } = require("../controllers/centreController");

const router = express.Router();

router.get("/", getAllCentres);
router.get("/:id", getCentreById);

module.exports = router;
