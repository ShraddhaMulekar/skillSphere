import { toPublicUser } from "../../utils/authResponse.js";

export const getMe = async (req, res) => {
  try {
    return await res.status(200).json({
      success: true,
      user: toPublicUser(req.user),
    });
  } catch (error) {
    return await res.status(500).json({
      success: false,
      message: "Error fetching user data",
      error: error.message,
    });
  }
};
