const generateToken = async (userId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    const user = await User.findById(userId)
      .populate("branchIds")
      .populate("centreIds")
      .populate("regionIds")
      .lean();

    if (!user) {
      console.error("User not found for ID:", userId);
      throw new Error("User not found");
    }

    // Extract names from populated arrays
    const branchNames = user.branchIds?.map((b) => b.name) || ["Unknown"];
    const centreNames = user.centreIds?.map((c) => c.name) || ["Unknown"];
    const regionNames = user.regionIds?.map((r) => r.name) || ["Unknown"];

    return jwt.sign(
      {
        id: user._id,
        loginId: user.loginId,
        role: user.role,
        name: user.name,
        mobileNumber: user.mobileNumber,
        email: user.email,
        status: user.status,
        branches: branchNames,
        centres: centreNames,
        regions: regionNames,
      },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "1h" }
    );
  } catch (error) {
    console.error("Error generating token:", error.message);
    throw new Error("Token generation failed");
  }
};

module.exports = generateToken;
