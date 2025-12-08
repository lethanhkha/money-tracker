"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import AddCategoryModal from "@/components/AddCategoryModal";
import EditCategoryModal from "@/components/EditCategoryModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import { Plus, Edit2, Trash2, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesApi } from "@/lib/api/categories";
import { Category } from "@/lib/types";
import toast from "react-hot-toast";

export default function CategoriesPage() {
  const [activeTab, setActiveTab] = useState<"income" | "expense">("expense");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null
  );
  const queryClient = useQueryClient();

  // Fetch categories
  const {
    data: allCategories = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["categories", activeTab],
    queryFn: () => categoriesApi.getAll(activeTab),
  });

  // Filter out system categories
  const categories = allCategories.filter(
    (cat: any) => cat.name !== "Tiết kiệm" && cat.name !== "Hoàn tiền mục tiêu"
  );

  // Create mutation
  const createMutation = useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setIsAddModalOpen(false);
      toast.success("Thêm phân loại thành công!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Không thể thêm phân loại");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      categoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setEditingCategory(null);
      toast.success("Cập nhật phân loại thành công!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Không thể cập nhật phân loại"
      );
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setDeletingCategory(null);
      toast.success("Xóa phân loại thành công!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Không thể xóa phân loại");
    },
  });

  const handleCreate = (data: any) => {
    const currentTab = activeTab;
    createMutation.mutate(
      { ...data, type: currentTab },
      {
        onSuccess: () => {
          setActiveTab(currentTab);
        },
      }
    );
  };

  const handleUpdate = (data: any) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    }
  };

  const handleDelete = () => {
    if (deletingCategory) {
      deleteMutation.mutate(deletingCategory.id);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Phân loại
              </h1>
              <p className="mt-2 text-sm sm:text-base text-gray-600">
                Quản lý danh mục thu chi
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus className="w-5 h-5 sm:mr-2" />
              <span className="sm:inline">Thêm phân loại</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 animate-slideUp">
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab("expense")}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-300 ${
                    activeTab === "expense"
                      ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Chi tiêu
                </button>
                <button
                  onClick={() => setActiveTab("income")}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-300 ${
                    activeTab === "income"
                      ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Thu nhập
                </button>
              </div>
            </div>

            {/* Categories List */}
            <div className="p-6 animate-fadeIn" key={activeTab}>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-12 text-red-600">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span>Không thể tải danh sách phân loại</span>
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📂</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Chưa có phân loại nào
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Thêm phân loại mới để quản lý thu chi
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category, index) => (
                    <div
                      key={category.id}
                      className="p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-300 hover:scale-105 card-hover animate-slideUp"
                      style={{
                        borderLeftWidth: "4px",
                        borderLeftColor: category.color,
                        animationDelay: `${index * 0.05}s`,
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl hover:scale-110 transition-transform duration-200"
                            style={{ backgroundColor: `${category.color}20` }}
                          >
                            {category.icon}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {category.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {category.type === "income"
                                ? "Thu nhập"
                                : "Chi tiêu"}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => setEditingCategory(category)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 hover:scale-110"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingCategory(category)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modals */}
        <AddCategoryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleCreate}
          isLoading={createMutation.isPending}
          type={activeTab}
        />

        {editingCategory && (
          <EditCategoryModal
            isOpen={!!editingCategory}
            onClose={() => setEditingCategory(null)}
            onSubmit={handleUpdate}
            isLoading={updateMutation.isPending}
            category={editingCategory}
          />
        )}

        {deletingCategory && (
          <DeleteConfirmModal
            isOpen={!!deletingCategory}
            onClose={() => setDeletingCategory(null)}
            onConfirm={handleDelete}
            isLoading={deleteMutation.isPending}
            title="Xóa phân loại"
            message={`Bạn có chắc muốn xóa phân loại "${deletingCategory.name}"? Hành động này không thể hoàn tác.`}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
