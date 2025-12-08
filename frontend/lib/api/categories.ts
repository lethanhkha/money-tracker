import axiosInstance from "../axios";
import { Category } from "../types";

export interface CreateCategoryData {
  name: string;
  type: "income" | "expense";
  icon?: string;
  color?: string;
}

export interface UpdateCategoryData {
  name?: string;
  icon?: string;
  color?: string;
}

export interface CategoryResponse {
  message: string;
  data: Category;
}

export interface CategoriesListResponse {
  data: Category[];
}

export const categoriesApi = {
  // Get all categories
  getAll: async (type?: "income" | "expense"): Promise<Category[]> => {
    const params = type ? { type } : {};
    const response = await axiosInstance.get<CategoriesListResponse>(
      "/categories",
      { params }
    );
    return response.data.data;
  },

  // Get category by ID
  getById: async (id: string): Promise<{ data: Category }> => {
    const response = await axiosInstance.get<{ data: Category }>(
      `/categories/${id}`
    );
    return response.data;
  },

  // Create new category
  create: async (data: CreateCategoryData): Promise<CategoryResponse> => {
    const response = await axiosInstance.post<CategoryResponse>(
      "/categories",
      data
    );
    return response.data;
  },

  // Update category
  update: async (
    id: string,
    data: UpdateCategoryData
  ): Promise<CategoryResponse> => {
    const response = await axiosInstance.put<CategoryResponse>(
      `/categories/${id}`,
      data
    );
    return response.data;
  },

  // Delete category
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await axiosInstance.delete<{ message: string }>(
      `/categories/${id}`
    );
    return response.data;
  },
};
