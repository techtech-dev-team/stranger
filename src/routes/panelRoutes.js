const express = require("express");
const Panel = require("../models/Panel");

const router = express.Router();

// Create Panel
router.post("/", async (req, res) => {
  try {
    const { panelName, centerIds } = req.body;
    const newPanel = new Panel({ panelName, centerIds });
    await newPanel.save();
    res.status(201).json(newPanel);
  } catch (error) {
    console.error("Error creating panel:", error);
    res.status(500).json({ message: "Error creating panel" });
  }
});

// Get all Panels
router.get("/", async (req, res) => {
  try {
    const panels = await Panel.find().populate("centerIds");
    res.status(200).json(panels);
  } catch (error) {
    console.error("Error fetching panels:", error);
    res.status(500).json({ message: "Error fetching panels" });
  }
});

// Update Panel
router.put("/:id", async (req, res) => {
  try {
    const { panelName, centerIds } = req.body;
    const updatedPanel = await Panel.findByIdAndUpdate(
      req.params.id,
      { panelName, centerIds },
      { new: true }
    );
    res.status(200).json(updatedPanel);
  } catch (error) {
    console.error("Error updating panel:", error);
    res.status(500).json({ message: "Error updating panel" });
  }
});

// Delete Panel
router.delete("/:id", async (req, res) => {
  try {
    await Panel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Panel deleted successfully" });
  } catch (error) {
    console.error("Error deleting panel:", error);
    res.status(500).json({ message: "Error deleting panel" });
  }
});

module.exports = router;
