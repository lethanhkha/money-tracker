import axiosInstance from "../axios";
import { Wallet } from "../types";

export interface CreateWalletData {
  name: string;
  balance: number;
  currency: string;
  icon?: string;
  color?: string;
}

export interface UpdateWalletData {
  name?: string;
  icon?: string;
  color?: string;
}

export interface WalletResponse {
  message: string;
  data: Wallet;
}

export interface WalletsListResponse {
  data: Wallet[];
}

export const walletsApi = {
  // Get all wallets
  getAll: async (): Promise<Wallet[]> => {
    const response = await axiosInstance.get<WalletsListResponse>("/wallets");
    return response.data.data;
  },

  // Get wallet by ID
  getById: async (id: string): Promise<{ data: Wallet }> => {
    const response = await axiosInstance.get<{ data: Wallet }>(
      `/wallets/${id}`
    );
    return response.data;
  },

  // Create new wallet
  create: async (data: CreateWalletData): Promise<WalletResponse> => {
    const response = await axiosInstance.post<WalletResponse>("/wallets", data);
    return response.data;
  },

  // Update wallet
  update: async (
    id: string,
    data: UpdateWalletData
  ): Promise<WalletResponse> => {
    const response = await axiosInstance.put<WalletResponse>(
      `/wallets/${id}`,
      data
    );
    return response.data;
  },

  // Delete wallet
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await axiosInstance.delete<{ message: string }>(
      `/wallets/${id}`
    );
    return response.data;
  },

  // Set wallet as default
  setDefault: async (id: string): Promise<{ message: string }> => {
    const response = await axiosInstance.put<{ message: string }>(
      `/wallets/${id}/set-default`
    );
    return response.data;
  },
};
