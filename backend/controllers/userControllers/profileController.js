import { UserModel } from "../../models/UserModel.js";
import { toPublicUser } from "../../utils/authResponse.js";

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
      milestoneRate,
      portfolio,
      resume,
      certifications,
      experience,
      availability,
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
      if (milestoneRate !== undefined) user.milestoneRate = milestoneRate;
      if (portfolio !== undefined) user.portfolio = portfolio;
      if (resume !== undefined) user.resume = resume;
      if (certifications !== undefined) user.certifications = certifications;
      if (experience !== undefined) user.experience = experience;
      if (availability !== undefined) user.availability = availability;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: toPublicUser(user),
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
