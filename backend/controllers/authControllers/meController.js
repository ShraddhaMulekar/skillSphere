import { toPublicUser } from "../../utils/authResponse.js";

export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: toPublicUser(req.user),
  });
};
