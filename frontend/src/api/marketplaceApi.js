import api from "./axios";

export const getGigs = (params = {}) => api.get("/api/gigs", { params });
export const getGig = (id) => api.get(`/api/gigs/${id}`);
export const createGig = (data) => api.post("/api/gigs", data);
export const updateGigProgress = (id, data) => api.patch(`/api/gigs/${id}/progress`, data);
export const deleteGig = (id) => api.delete(`/api/gigs/${id}`);
export const getRecommendations = (gigId) => api.get(`/api/gigs/${gigId}/recommendations`);
export const submitProposal = (gigId, data) => api.post(`/api/gigs/${gigId}/proposals`, data);
export const updateProposal = (id, data) => api.patch(`/api/proposals/${id}`, data);
export const getTrendingSkills = () => api.get("/api/trending-skills");
export const createReview = (data) => api.post("/api/reviews", data);
export const getMyAnalytics = () => api.get("/api/analytics/me");

export const getMessages = (params = {}) => api.get("/api/messages", { params });
export const sendMessage = (data) => api.post("/api/messages", data);
export const getNotifications = () => api.get("/api/notifications");
export const markNotificationsRead = (ids) => api.patch("/api/notifications/read", { ids });

export const getPayments = () => api.get("/api/payments");
export const createPayment = (data) => api.post("/api/payments", data);
export const verifyPayment = (id, data) => api.post(`/api/payments/${id}/verify`, data);
export const releasePayment = (id, data = {}) => api.post(`/api/payments/${id}/release`, data);
export const refundPayment = (id, data = {}) => api.post(`/api/payments/${id}/refund`, data);

export const getDisputes = () => api.get("/api/disputes");
export const createDispute = (data) => api.post("/api/disputes", data);
export const updateDispute = (id, data) => api.patch(`/api/disputes/${id}`, data);
