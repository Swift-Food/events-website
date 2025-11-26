import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import type { authApi as AuthApiType } from "./authApi";

// Create axios instance
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Lazy import authApi to avoid circular dependency issues
let authApiInstance: typeof AuthApiType | null = null;
const getAuthApi = async () => {
  if (!authApiInstance) {
    const { authApi } = await import("./authApi");
    authApiInstance = authApi;
  }
  return authApiInstance;
};

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("auth_token");

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// Response interceptor - Handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 errors - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      const url = originalRequest?.url || "";

      // Don't try to refresh for auth endpoints (login, register, etc.)
      if (url.includes("/auth/")) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            reject: (err: Error) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refresh_token");

      if (!refreshToken) {
        isRefreshing = false;
        // No refresh token - clear auth and show login modal
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_data");
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("open-login-modal", {
              detail: {
                message: "Your session has expired. Please log in again.",
              },
            })
          );
        }
        return Promise.reject(error);
      }

      try {
        // Use centralized authApi.refreshToken method
        const authApi = await getAuthApi();
        const tokenData = await authApi.refreshToken(refreshToken);

        const { access_token, refresh_token: newRefreshToken } = tokenData;

        // Store new tokens
        localStorage.setItem("auth_token", access_token);
        localStorage.setItem("refresh_token", newRefreshToken);

        // Update the failed request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        // Process queued requests
        processQueue(null, access_token);

        isRefreshing = false;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear auth and show login modal
        processQueue(refreshError as Error, null);
        isRefreshing = false;

        localStorage.removeItem("auth_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user_data");

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("open-login-modal", {
              detail: {
                message: "Your session has expired. Please log in again.",
              },
            })
          );
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
