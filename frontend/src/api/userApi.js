import api from "./axios";

export const updateProfile = (data) => api.put("/users/profile", data);
export const getProfile = () => api.get("/users/me");
