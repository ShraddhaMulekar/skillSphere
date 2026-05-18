import jwt from "jsonwebtoken";
import { UserModel } from "../models/UserModel.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized, no token" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await UserModel.findById(decoded.id);
    next();
    
  } catch (error) {
    return res
      .status(401)
      .json({
        success: false,
        message: "Token invalid or expired",
        error: error.message,
      });
  }
};
