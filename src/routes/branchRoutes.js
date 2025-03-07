const express = require("express");
const { getAllBranches, getBranchById } = require("../controllers/branchController");

const router = express.Router();

router.get("/", getAllBranches);
router.get("/:id", getBranchById);

module.exports = router;
