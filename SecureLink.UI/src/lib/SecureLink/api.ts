import { privateApiClient, publicApiClient } from "./apiClient";
import {
  BatchFileStatusRequest,
  BatchFileStatusResponse,
  FileUploadResponse,
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  UserResponse,
} from "./types";

export const loginApi = async (request: LoginRequest) => {
  const { data } = await publicApiClient.post<LoginResponse>(
    "/auth/login",
    request,
  );
  return data;
};

export const logoutApi = async (request: LogoutRequest) => {
  await privateApiClient.post("/auth/logout", request);
};

export const getUser = async (userId: string) => {
  const { data } = await privateApiClient.get<UserResponse>(`/users/${userId}`);
  return data;
};

export const uploadFiles = async (formData: FormData) => {
  const { data } = await privateApiClient.post<FileUploadResponse>(
    "/files",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return data;
};

export const getBatchStatus = async (request: BatchFileStatusRequest) => {
  const { data } = await privateApiClient.post<BatchFileStatusResponse>(
    "/files/status/batch",
    request,
  );
  return data;
};
