const express = require("express");
const {
    getAllCentres,
    getCentreById,
    getInactiveCentres,
    getActiveCentres,
    getCombinedMonthlySalesByCentre,
    getMonthlySalesByCentre,
    getCombinedMonthlyClientsByCentre,
    getMonthlyClientsByCentre,
    getCentreStatistics,
    addCentre,
    getCentreReport,
    getPreviousThreeDaysSales,
    getCentresWithDetails,
    sseCentreUpdates,
    updateCentre,
    deleteCentreById
} = require("../controllers/centreController");

const router = express.Router();
router.get("/full", getCentresWithDetails);
router.get("/centre-stats", getCentreStatistics);
router.get("/monthly-sales", getMonthlySalesByCentre);
router.get("/combined-sales", getCombinedMonthlySalesByCentre);
router.get("/monthly-clients", getMonthlyClientsByCentre);
router.get("/combined-clients", getCombinedMonthlyClientsByCentre);
router.get("/", getAllCentres);
router.post("/", addCentre);
router.get("/inactive/list", getInactiveCentres);
router.get("/active/list", getActiveCentres);
router.get("/:id", getCentreById);
router.get("/report/:centerId", getCentreReport);
router.get("/previous-three-days-sales/:centerId", getPreviousThreeDaysSales);
router.put("/:id",updateCentre);
router.delete("/:id", deleteCentreById);
router.get("/sse-updates", sseCentreUpdates); // SSE Route

module.exports = router;
