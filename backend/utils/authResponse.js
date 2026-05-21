import { generateToken } from "./generateToken.js";

export const toPublicUser = (user) => ({
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
  milestoneRate: user.milestoneRate,
  portfolio: user.portfolio,
  resume: user.resume,
  certifications: user.certifications,
  experience: user.experience,
  availability:
    user.availability instanceof Map
      ? Object.fromEntries(user.availability)
      : user.availability,
  verificationBadge: user.verificationBadge,
  isSuspended: user.isSuspended,
  twoFactorEnabled: user.twoFactorEnabled,
  authProvider: user.authProvider,
});

export const sendAuthSuccess = (res, user, statusCode = 200, message, extra = {}) => {
  const token = generateToken(user._id, user.role);
  const body = {
    success: true,
    token,
    user: toPublicUser(user),
    ...extra,
  };
  if (message) body.message = message;
  return res.status(statusCode).json(body);
};
