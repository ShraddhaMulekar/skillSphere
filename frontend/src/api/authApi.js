import api from "./axios";

export const registerUser = (data) => api.post("/auth/register", data);
export const loginUser = (data) => api.post("/auth/login", data);
export const verifyEmail = (token) => api.get(`/auth/verify-email/${token}`);
export const getMe = () => api.get("/auth/me");
