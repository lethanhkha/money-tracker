import axiosInstance from "../axios";
import { Transaction } from "../types";

export interface CreateTransactionData {
  type: "income" | "expense";
  amount: number;
  categoryId: string;
  walletId: string;
  description?: string;
  date: string;
  status?: "pending" | "completed";
  workDate?: string;
  receivedDate?: string;
}

export interface UpdateTransactionData {
  amount?: number;
  categoryId?: string;
  walletId?: string;
  description?: string;
  date?: string;
  status?: "pending" | "completed";
  workDate?: string;
  receivedDate?: string;
}

export interface TransactionResponse {
  message: string;
  data: Transaction;
}

export interface TransactionsListResponse {
  data: Transaction[];
}

export const transactionsApi = {
  // Get all transactions
  getAll: async (params?: {
    type?: "income" | "expense";
    status?: "pending" | "completed";
    startDate?: string;
    endDate?: string;
  }): Promise<Transaction[]> => {
    const response = await axiosInstance.get<TransactionsListResponse>(
      "/transactions",
      { params }
    );
    return response.data.data;
  },

  // Get transaction by ID
  getById: async (id: string): Promise<{ data: Transaction }> => {
    const response = await axiosInstance.get<{ data: Transaction }>(
      `/transactions/${id}`
    );
    return response.data;
  },

  // Create new transaction
  create: async (data: CreateTransactionData): Promise<TransactionResponse> => {
    const response = await axiosInstance.post<TransactionResponse>(
      "/transactions",
      data
    );
    return response.data;
  },

  // Update transaction
  update: async (
    id: string,
    data: UpdateTransactionData
  ): Promise<TransactionResponse> => {
    const response = await axiosInstance.put<TransactionResponse>(
      `/transactions/${id}`,
      data
    );
    return response.data;
  },

  // Delete transaction
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await axiosInstance.delete<{ message: string }>(
      `/transactions/${id}`
    );
    return response.data;
  },

  // Mark pending transaction as received
  markAsReceived: async (id: string): Promise<TransactionResponse> => {
    const response = await axiosInstance.patch<TransactionResponse>(
      `/transactions/${id}/mark-received`
    );
    return response.data;
  },

  // Get monthly summary
  getMonthlySummary: async (
    month: number,
    year: number
  ): Promise<{
    data: {
      totalIncome: number;
      totalExpense: number;
      pendingTips: number;
      balance: number;
    };
  }> => {
    const response = await axiosInstance.get(`/transactions/summary/monthly`, {
      params: { month, year },
    });
    return response.data;
  },
};
