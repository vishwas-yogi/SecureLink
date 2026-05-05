import { FileProcessingStatuses, FileStatuses } from "./constants";

// Auth types
export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
  username: string;
};

export type RegisterRequest = {
  username: string;
  password: string;
  name: string;
  email?: string;
};

export type RegisterResponse = {};

export type RefreshTokensRequest = {
  refreshToken: string;
  userId: string;
};

export type RefreshTokenResponse = LoginResponse;

export type LogoutRequest = {
  refreshToken: string;
};

export type LogoutResponse = {};

// File types
export type FileUploadResponse = {
  id: string;
  filename: string;
  isError: boolean;
  error?: string;
}[];

export type FileUploadRequest = {
  files: File[];
};

export type FileSearchRequest = {
  files: File[];
};

export type FileSearchResponse = {
  matches: {
    fileId: string;
    matchScore: number;
  }[];
};

export type BatchFileStatusRequest = {
  fileIds: string[];
};

export type BatchFileStatusResponse = {
  statuses: {
    fileId: string;
    processingStatus: FileProcessingStatus;
    status: FileStatus;
  }[];
};

export type FileProcessingStatus = (typeof FileProcessingStatuses)[number];

export type FileStatus = (typeof FileStatuses)[number];

// User related types
export type UserResponse = {
  id: string;
  username: string;
  email?: string;
  name: string;
  createdAt: string;
  lastModifiedAt: string;
};

// Contexts
export type AuthContextType = {
  user?: UserResponse;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: (refreshToken: string) => void;
  setStoredUserId: (userId: string | null) => void;
};
