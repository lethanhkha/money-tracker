import api from "../axios";
import type { GoalContribution } from "../types";

export interface CreateGoalData {
  name: string;
  targetAmount: number;
  currentAmount?: number;
  deadline?: string;
  description?: string;
}

export interface UpdateGoalData {
  name?: string;
  targetAmount?: number;
  currentAmount?: number;
  deadline?: string;
  description?: string;
  status?: "active" | "completed" | "cancelled";
}

export interface ContributeGoalData {
  amount: number;
  walletId: string;
  contributionDate?: string;
  note?: string;
}

export interface ContributionsResponse {
  data: GoalContribution[];
}

export interface GoalResponse {
  message: string;
  data: any;
}

export const goalsApi = {
  getAll: async () => {
    const response = await api.get("/goals");
    return response.data.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/goals/${id}`);
    return response.data.data;
  },

  create: async (data: CreateGoalData) => {
    const response = await api.post("/goals", data);
    return response.data.data;
  },

  update: async (id: string, data: UpdateGoalData) => {
    const response = await api.put(`/goals/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/goals/${id}`);
    return response.data;
  },

  contribute: async (id: string, data: ContributeGoalData) => {
    const response = await api.post(`/goals/${id}/contribute`, {
      contributionAmount: data.amount,
      walletId: data.walletId,
      contributionDate: data.contributionDate,
      note: data.note,
    });
    return response.data.data;
  },

  getContributions: async (id: string): Promise<GoalContribution[]> => {
    const response = await api.get<ContributionsResponse>(
      `/goals/${id}/contributions`
    );
    return response.data.data;
  },

  deleteContribution: async (
    goalId: string,
    contributionId: string
  ): Promise<GoalResponse> => {
    const response = await api.delete<GoalResponse>(
      `/goals/${goalId}/contributions/${contributionId}`
    );
    return response.data;
  },
};
