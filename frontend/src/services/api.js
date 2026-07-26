import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let getTokenFn = null;

export const setAuthTokenGetter = (fn) => {
  getTokenFn = fn;
};

api.interceptors.request.use(async (config) => {
  if (getTokenFn) {
    try {
      const token = await getTokenFn();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn("[API] Could not fetch Clerk token:", e);
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.response?.data?.msg ||
      "Something went wrong";
    return Promise.reject(new Error(msg));
  },
);

// ML Prediction Endpoint
export const runMLPrediction = (data) => api.post("/api/predict", data);

// Prediction History CRUD
export const savePrediction = (data) => api.post("/api/prediction", data);
export const getAllPredictions = () => api.get("/api/prediction");
export const getPredictionById = (id) => api.get(`/api/prediction/${id}`);
export const deletePrediction = (id) => api.delete(`/api/prediction/${id}`);

// Admin Analytics
export const getAdminStats = () => api.get("/api/admin/stats");
export const getAdminPredictions = () => api.get("/api/admin/predictions");

export default api;
