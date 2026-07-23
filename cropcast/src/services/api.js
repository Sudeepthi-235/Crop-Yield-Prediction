import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err.response?.data?.message ||
      err.response?.data?.msg ||
      "Something went wrong";
    return Promise.reject(new Error(msg));
  },
);

// Auth
export const registerUser = (data) => api.post("/api/auth/register", data);
export const loginUser = (data) => api.post("/api/auth/login", data);
export const logoutUser = () => api.post("/api/auth/logout");
export const getMe = () => api.get("/api/auth/getme");

// ML Model
export const runMLPrediction = (data) => api.post("/api/mlmodel", data);

// Predictions
export const savePrediction = (data) => api.post("/api/prediction", data);
export const getAllPredictions = () => api.get("/api/prediction");
export const getPredictionById = (id) => api.get(`/api/prediction/${id}`);
export const deletePrediction = (id) => api.delete(`/api/prediction/${id}`);

export default api;
