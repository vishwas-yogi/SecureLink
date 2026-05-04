import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { RefreshTokenResponse, RefreshTokensRequest } from "./types";
import { Local_Storage_Keys } from "./constants";

const BASE_URL = "http://localhost:5009";

export const privateApiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application//json" },
});

// Interceptor for handling Bearer token
privateApiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("accessToken");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Interceptor for silent refresh
interface CustomRequestConfig extends InternalAxiosRequestConfig {
  _retry: boolean;
}

// Concurrent failed API request may cause refreshing of tokens multiple times
// leading to race issues and invalidate refresh tokens
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  failedQueue = [];
};

privateApiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomRequestConfig;

    // Check for 401 and try only once
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem("refreshToken");
      const userId = localStorage.getItem("userId");

      // Return if tokens are missing
      if (!refreshToken || !userId) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue other 401 requests while one is already refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return privateApiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Using a separate api instance to avoid loop
        const { data } = await axios.post<RefreshTokenResponse>(
          `${BASE_URL}/auth/refresh`,
          {
            refreshToken,
            userId,
          } satisfies RefreshTokensRequest,
        );

        localStorage.setItem(Local_Storage_Keys.accessToken, data.accessToken);
        localStorage.setItem(Local_Storage_Keys.refreshToken, data.refreshToken);

        // Use the new token
        processQueue(null, data.accessToken);

        // Update the original request
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return privateApiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

// A public api client for endpoints that don't require Auth like login or signup
export const publicApiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});
