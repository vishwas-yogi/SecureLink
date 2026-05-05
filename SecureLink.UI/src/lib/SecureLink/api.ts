import { privateApiClient, publicApiClient } from "./apiClient";
import { Local_Storage_Keys } from "./constants";
import { LoginRequest, LoginResponse, LogoutRequest, LogoutResponse, UserResponse } from "./types";

export const loginApi = async (request: LoginRequest) => {
    const { data } = await publicApiClient.post<LoginResponse>('/auth/login', request);
    return data;
};


export const logoutApi = async (request: LogoutRequest) => {
    await privateApiClient.post('/auth/logout', request);
}

export const getUser = async (userId: string) => {
    const { data } = await privateApiClient.get<UserResponse>(`/users/${userId}`);
    return data;
}