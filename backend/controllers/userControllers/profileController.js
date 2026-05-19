import { UserModel } from "../../models/UserModel.js";

export const updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const {
      name,
      phone,
      bio,
      location,
      avatar,
      companyName,
      skills,
      hourlyRate,
    } = req.body;

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (avatar !== undefined) user.avatar = avatar;

    if (user.role === "client" && companyName !== undefined) {
      user.companyName = companyName;
    }

    if (user.role === "freelancer") {
      if (skills !== undefined) user.skills = skills;
      if (hourlyRate !== undefined) user.hourlyRate = hourlyRate;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
        phone: user.phone,
        bio: user.bio,
        location: user.location,
        companyName: user.companyName,
        skills: user.skills,
        hourlyRate: user.hourlyRate,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id).select(
      "-password -emailVerificationToken -passwordResetToken",
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user",
      error: error.message,
    });
  }
};
