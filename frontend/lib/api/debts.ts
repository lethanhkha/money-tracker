import axiosInstance from "../axios";
import { Debt, DebtPayment } from "../types";

export interface CreateDebtData {
  type: "lend" | "borrow";
  personName: string;
  amount: number;
  dueDate?: string;
  description?: string;
}

export interface UpdateDebtData {
  personName?: string;
  amount?: number;
  dueDate?: string;
  description?: string;
  status?: "pending" | "partial" | "completed";
}

export interface PartialPaymentData {
  amount: number;
  paymentDate?: string;
  note?: string;
}

export interface DebtResponse {
  message: string;
  data: Debt;
}

export interface DebtsListResponse {
  data: Debt[];
}

export interface PaymentsResponse {
  data: DebtPayment[];
}

export const debtsApi = {
  // Get all debts
  getAll: async (params?: {
    type?: "lend" | "borrow";
    status?: "pending" | "partial" | "completed";
  }): Promise<Debt[]> => {
    const response = await axiosInstance.get<DebtsListResponse>("/debts", {
      params,
    });
    return response.data.data;
  },

  // Get debt by ID
  getById: async (id: string): Promise<{ data: Debt }> => {
    const response = await axiosInstance.get<{ data: Debt }>(`/debts/${id}`);
    return response.data;
  },

  // Create new debt
  create: async (data: CreateDebtData): Promise<DebtResponse> => {
    const response = await axiosInstance.post<DebtResponse>("/debts", data);
    return response.data;
  },

  // Update debt
  update: async (id: string, data: UpdateDebtData): Promise<DebtResponse> => {
    const response = await axiosInstance.put<DebtResponse>(
      `/debts/${id}`,
      data
    );
    return response.data;
  },

  // Delete debt
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await axiosInstance.delete<{ message: string }>(
      `/debts/${id}`
    );
    return response.data;
  },

  // Make partial payment
  makePartialPayment: async (
    id: string,
    data: PartialPaymentData
  ): Promise<DebtResponse> => {
    const response = await axiosInstance.post<DebtResponse>(
      `/debts/${id}/pay`,
      data
    );
    return response.data;
  },

  // Get all payments for a debt
  getPayments: async (id: string): Promise<DebtPayment[]> => {
    const response = await axiosInstance.get<PaymentsResponse>(
      `/debts/${id}/payments`
    );
    return response.data.data;
  },

  // Delete a payment
  deletePayment: async (
    debtId: string,
    paymentId: string
  ): Promise<DebtResponse> => {
    const response = await axiosInstance.delete<DebtResponse>(
      `/debts/${debtId}/payments/${paymentId}`
    );
    return response.data;
  },
};
