import api from "./axios";

export const getAdminStats = () => api.get("/admin/stats");
export const getAdminUsers = () => api.get("/admin/users");
export const updateAdminUserStatus = (id, data) =>
  api.patch(`/admin/users/${id}/status`, data);
