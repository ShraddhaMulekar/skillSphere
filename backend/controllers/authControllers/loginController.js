import { UserModel } from "../../models/UserModel.js";
import { generateToken } from "../../utils/generateToken.js";

export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password
    const user = await UserModel.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email" });
    }

    // Check password
    bcrypt.compare(password, user.password, async (err, result) => {
      if (err) {
        return res
          .status(500)
          .json({
            success: false,
            message: "Error occurred while checking password",
            error: err.message,
          });
      }
      if (!result) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid password" });
      }
    });

    // Generate token
    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Error occurred while logging in",
        error: error.message,
      });
  }
};
