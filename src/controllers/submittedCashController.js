const SubmittedCash = require("../models/submittedCash");
const User = require("../models/User");

const submitCash = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "User not authenticated." });
    }
    const { amountPaid, dateSubmitted, submittedTo, remark } = req.body;
    const submittedBy = req.user._id; // Assuming `req.user` contains the logged-in user's ID

    // Validate required fields
    if (!amountPaid || !dateSubmitted || !submittedTo) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Find the submitting user
    const submittingUser = await User.findById(submittedBy);
    if (!submittingUser) {
      return res.status(404).json({ message: "Submitting user not found." });
    }

    // Check if the submitting user has enough cash in hand
    if (submittingUser.cashInHand < amountPaid) {
      return res.status(400).json({ message: "Insufficient cash in hand." });
    }

    // Find the receiving user
    const receivingUser = await User.findById(submittedTo);
    if (!receivingUser) {
      return res.status(404).json({ message: "Receiving user not found." });
    }

    // Validate the role of the receiving user
    const allowedRoles = ["ARM", "BSS", "OT"];
    if (!allowedRoles.includes(receivingUser.role)) {
      return res.status(400).json({
        message: `Cash can only be submitted to users with roles: ${allowedRoles.join(", ")}.`,
      });
    }

    // Create a new SubmittedCash record
    const submittedCash = new SubmittedCash({
      amountPaid,
      dateSubmitted,
      submittedTo,
      submittedBy,
      remark,
    });
    await submittedCash.save();

    // Update cashInHand for both users
    submittingUser.cashInHand -= amountPaid; // Deduct from submitting user's cashInHand
    receivingUser.cashInHand += amountPaid; // Add to receiving user's cashInHand

    await submittingUser.save();
    await receivingUser.save();

    res.status(201).json({
      message: "Cash submitted successfully.",
      submittedCash,
    });
  } catch (error) {
    console.error("Error submitting cash:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
// Get all submissions
const getAllSubmissions = async (req, res) => {
    try {
      const submissions = await SubmittedCash.find()
        .populate("submittedTo", "name role") // Populate submittedTo with name and role
        .populate("submittedBy", "name role"); // Populate submittedBy with name and role
  
      res.status(200).json(submissions);
    } catch (error) {
      console.error("Error fetching all submissions:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  };
  
  // Get submissions filtered by submittedTo
  const getSubmissionsBySubmittedTo = async (req, res) => {
    try {
      const { userId } = req.params; // Get userId from request params
      const submissions = await SubmittedCash.find({ submittedTo: userId })
        .populate("submittedTo", "name role") // Populate submittedTo with name and role
        .populate("submittedBy", "name role"); // Populate submittedBy with name and role
  
      res.status(200).json(submissions);
    } catch (error) {
      console.error("Error fetching submissions by submittedTo:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  };
  
  // Get submissions filtered by submittedBy
  const getSubmissionsBySubmittedBy = async (req, res) => {
    try {
      const { userId } = req.params; // Get userId from request params
      const submissions = await SubmittedCash.find({ submittedBy: userId })
        .populate("submittedTo", "name role") // Populate submittedTo with name and role
        .populate("submittedBy", "name role"); // Populate submittedBy with name and role
  
      res.status(200).json(submissions);
    } catch (error) {
      console.error("Error fetching submissions by submittedBy:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  };
  
  module.exports = {
    submitCash,
    getAllSubmissions,
    getSubmissionsBySubmittedTo,
    getSubmissionsBySubmittedBy,
  };;