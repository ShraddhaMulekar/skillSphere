export const requireVerified = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: "Please verify your email before accessing this resource",
      code: "EMAIL_NOT_VERIFIED",
    });
  }
  next();
};
