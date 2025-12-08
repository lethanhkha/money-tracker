"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import AddGoalModal from "@/components/AddGoalModal";
import EditGoalModal from "@/components/EditGoalModal";
import ContributeGoalModal from "@/components/ContributeGoalModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import GoalContributionHistoryModal from "@/components/GoalContributionHistoryModal";
import {
  Plus,
  Target,
  TrendingUp,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  DollarSign,
  History,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { goalsApi } from "@/lib/api/goals";
import toast from "react-hot-toast";
import { useCountAnimation } from "@/lib/hooks/useCountAnimation";

export default function GoalsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<any>(null);
  const [goalToContribute, setGoalToContribute] = useState<any>(null);
  const [goalToDelete, setGoalToDelete] = useState<any>(null);
  const [goalForHistory, setGoalForHistory] = useState<any>(null);
  const queryClient = useQueryClient();

  // Fetch goals
  const {
    data: goals = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["goals"],
    queryFn: () => goalsApi.getAll(),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: goalsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Thêm mục tiêu thành công!");
      setIsAddModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Không thể thêm mục tiêu");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      goalsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Cập nhật mục tiêu thành công!");
      setIsEditModalOpen(false);
      setGoalToEdit(null);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Không thể cập nhật mục tiêu"
      );
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: goalsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Xóa mục tiêu thành công!");
      setIsDeleteModalOpen(false);
      setGoalToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Không thể xóa mục tiêu");
    },
  });

  // Contribute mutation
  const contributeMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        amount: number;
        walletId: string;
        contributionDate?: string;
        note?: string;
      };
    }) => goalsApi.contribute(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Đóng góp thành công!");
      setIsContributeModalOpen(false);
      setGoalToContribute(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Không thể đóng góp");
    },
  });

  const handleCreate = (data: any) => {
    createMutation.mutate(data);
  };

  const handleUpdate = (data: any) => {
    if (goalToEdit) {
      updateMutation.mutate({ id: goalToEdit.id, data });
    }
  };

  const handleDelete = () => {
    if (goalToDelete) {
      deleteMutation.mutate(goalToDelete.id);
    }
  };

  const handleContribute = (data: {
    amount: number;
    walletId: string;
    contributionDate?: string;
    note?: string;
  }) => {
    if (goalToContribute) {
      contributeMutation.mutate({ id: goalToContribute.id, data });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const activeGoals = goals.filter((g: any) => g.status === "active");
  const completedGoals = goals.filter((g: any) => g.status === "completed");
  const totalTargetAmount = goals
    .filter((g: any) => g.status === "active")
    .reduce((sum: number, g: any) => sum + g.targetAmount, 0);

  // Animated counters
  const animatedActiveCount = useCountAnimation(activeGoals.length, 500);
  const animatedCompletedCount = useCountAnimation(completedGoals.length, 500);
  const animatedTotalTarget = useCountAnimation(totalTargetAmount, 800);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex flex-col items-center justify-center min-h-screen">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-gray-600">
              Không thể tải danh sách mục tiêu. Vui lòng thử lại.
            </p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Mục tiêu
              </h1>
              <p className="mt-2 text-sm sm:text-base text-gray-600">
                Quản lý mục tiêu tiết kiệm
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus className="w-5 h-5 sm:mr-2" />
              <span className="sm:inline">Thêm mục tiêu</span>
            </button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 card-hover animate-slideUp"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Đang hoạt động
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(animatedActiveCount)}
                  </p>
                </div>
              </div>
            </div>

            <div
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 card-hover animate-slideUp"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Hoàn thành
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {Math.round(animatedCompletedCount)}
                  </p>
                </div>
              </div>
            </div>

            <div
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 card-hover animate-slideUp"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Tổng mục tiêu
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(animatedTotalTarget)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Goals list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goals.length === 0 ? (
              <div className="col-span-full bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100 animate-slideUp">
                <Target className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-bounce" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Chưa có mục tiêu nào
                </h3>
                <p className="text-gray-500 mb-4">
                  Bắt đầu thêm mục tiêu tiết kiệm của bạn
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition hover:scale-105"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Thêm mục tiêu đầu tiên
                </button>
              </div>
            ) : (
              goals.map((goal: any, index: number) => {
                const progress = calculateProgress(
                  goal.currentAmount,
                  goal.targetAmount
                );
                const isCompleted = goal.status === "completed";

                return (
                  <div
                    key={goal.id}
                    className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300 hover:scale-105 card-hover animate-slideUp"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {goal.name}
                          </h3>
                          {isCompleted && (
                            <CheckCircle2 className="w-5 h-5 text-green-600 animate-successPulse" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {goal.description}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!isCompleted && (
                          <button
                            onClick={() => {
                              setGoalToContribute(goal);
                              setIsContributeModalOpen(true);
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 hover:scale-110"
                            title="Đóng góp"
                          >
                            <DollarSign className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setGoalForHistory(goal);
                            setIsHistoryModalOpen(true);
                          }}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 hover:scale-110"
                          title="Xem lịch sử đóng góp"
                        >
                          <History className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setGoalToEdit(goal);
                            setIsEditModalOpen(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setGoalToDelete(goal);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
                          title="Xóa"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>{formatCurrency(goal.currentAmount)}</span>
                        <span>{formatCurrency(goal.targetAmount)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-3 rounded-full animate-progressFill ${
                            isCompleted
                              ? "bg-green-500"
                              : progress >= 75
                              ? "bg-indigo-600"
                              : progress >= 50
                              ? "bg-blue-500"
                              : "bg-yellow-500"
                          }`}
                          style={{
                            width: `${progress}%`,
                            animationDelay: `${index * 0.1 + 0.2}s`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1 text-right">
                        {progress.toFixed(1)}% hoàn thành
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        {goal.deadline
                          ? format(goal.deadline, "dd/MM/yyyy", { locale: vi })
                          : "Vô thời hạn"}
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          isCompleted
                            ? "bg-green-100 text-green-700"
                            : "bg-indigo-100 text-indigo-700"
                        }`}
                      >
                        {isCompleted ? "Hoàn thành" : "Đang thực hiện"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Add Goal Modal */}
        <AddGoalModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleCreate}
          isLoading={createMutation.isPending}
        />

        {/* Edit Goal Modal */}
        {goalToEdit && (
          <EditGoalModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setGoalToEdit(null);
            }}
            goal={goalToEdit}
            onSubmit={handleUpdate}
            isLoading={updateMutation.isPending}
          />
        )}

        {/* Contribute Goal Modal */}
        {goalToContribute && (
          <ContributeGoalModal
            isOpen={isContributeModalOpen}
            onClose={() => {
              setIsContributeModalOpen(false);
              setGoalToContribute(null);
            }}
            goal={goalToContribute}
            onSubmit={handleContribute}
            isLoading={contributeMutation.isPending}
          />
        )}

        {/* Goal Contribution History Modal */}
        {goalForHistory && (
          <GoalContributionHistoryModal
            goalId={goalForHistory.id}
            goalName={goalForHistory.name}
            onClose={() => {
              setIsHistoryModalOpen(false);
              setGoalForHistory(null);
            }}
          />
        )}

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setGoalToDelete(null);
          }}
          onConfirm={handleDelete}
          title="Xóa mục tiêu"
          message={
            goalToDelete
              ? `Bạn có chắc chắn muốn xóa mục tiêu "${goalToDelete.name}"? Hành động này không thể hoàn tác.`
              : ""
          }
          isLoading={deleteMutation.isPending}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
