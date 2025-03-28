const express = require("express");
const router = express.Router();
const { getTopCentresBySales , getBottomCentresBySales , getCentresWithSuddenHike} = require("../controllers/salesController");

router.get("/top-centres", getTopCentresBySales);
router.get("/bottom-centres", getBottomCentresBySales);
router.get("/hike", getCentresWithSuddenHike);

module.exports = router;
