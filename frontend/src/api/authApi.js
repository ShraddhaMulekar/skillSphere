import api from "./axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

export const registerUser = (data) => api.post("/auth/register", data);
export const loginUser = (data) => api.post("/auth/login", data);
export const verify2FALogin = (data) => api.post("/auth/verify-2fa", data);
export const verifyEmail = (token) => api.get(`/auth/verify-email/${token}`);
export const verifyEmailWithCode = (data) => api.post("/auth/verify-email", data);
export const getMe = () => api.get("/auth/me");
export const forgotPassword = (email) =>
  api.post("/auth/forgot-password", { email });
export const resetPassword = (token, password) =>
  api.put(`/auth/reset-password/${token}`, { password });
export const resendVerification = () => api.post("/auth/resend-verification");
export const setup2FA = () => api.post("/auth/2fa/setup");
export const enable2FA = (token) => api.post("/auth/2fa/enable", { token });
export const disable2FA = (data) => api.post("/auth/2fa/disable", data);

export const getGoogleAuthUrl = (role = "client") =>
  `${API_URL}/auth/google?role=${role}`;
