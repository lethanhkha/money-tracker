import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds timeout for cold start
});

// Request interceptor to add token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Retry logic for 500 errors (server cold start)
    if (error.response?.status === 500 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Wait 2 seconds before retry (give server time to wake up)
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      return axiosInstance(originalRequest);
    }

    // Only redirect to login if 401 is from authenticated endpoints
    // Don't redirect if 401 is from login/register endpoints (invalid credentials)
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || "";
      const isAuthEndpoint =
        requestUrl.includes("/auth/login") ||
        requestUrl.includes("/auth/register");

      if (!isAuthEndpoint) {
        // 401 from protected endpoint - token expired or invalid
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
