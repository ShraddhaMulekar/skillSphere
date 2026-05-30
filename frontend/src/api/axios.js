import axios from "axios";

const isBrowser = typeof window !== "undefined";
const runtimeApiUrl =
  (isBrowser && window.__SKILLSPHERE_API_URL__) ||
  (isBrowser && window.__API_URL__);

const API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  runtimeApiUrl ||
  (isBrowser
    ? window.location.origin
    : "http://localhost:5000");

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
