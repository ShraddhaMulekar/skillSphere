import { generateToken } from "./generateToken.js";

export const toPublicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isVerified: user.isVerified,
  avatar: user.avatar,
  twoFactorEnabled: user.twoFactorEnabled,
  authProvider: user.authProvider,
});

export const sendAuthSuccess = (res, user, statusCode = 200, message) => {
  const token = generateToken(user._id, user.role);
  const body = {
    success: true,
    token,
    user: toPublicUser(user),
  };
  if (message) body.message = message;
  return res.status(statusCode).json(body);
};
