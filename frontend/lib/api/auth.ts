import axiosInstance from "../axios";
import {
  AuthResponse,
  LoginData,
  RegisterData,
  User,
  UpdateProfileData,
} from "../types";

export const authApi = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>(
      "/auth/register",
      data
    );
    return response.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>(
      "/auth/login",
      data
    );
    return response.data;
  },

  getMe: async (): Promise<{ user: User }> => {
    const response = await axiosInstance.get<{ user: User }>("/auth/me");
    return response.data;
  },

  updateProfile: async (
    data: UpdateProfileData
  ): Promise<{ message: string; user: User }> => {
    const response = await axiosInstance.put<{ message: string; user: User }>(
      "/auth/profile",
      data
    );
    return response.data;
  },
};
