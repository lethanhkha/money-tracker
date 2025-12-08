"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import AddDebtModal from "@/components/AddDebtModal";
import EditDebtModal from "@/components/EditDebtModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import PayDebtModal from "@/components/PayDebtModal";
import PaymentHistoryModal from "@/components/PaymentHistoryModal";
import {
  Plus,
  Users,
  UserPlus,
  UserMinus,
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
import { debtsApi } from "@/lib/api/debts";
import toast from "react-hot-toast";
import { useCountAnimation } from "@/lib/hooks/useCountAnimation";

export default function DebtsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [debtToEdit, setDebtToEdit] = useState<any>(null);
  const [debtToDelete, setDebtToDelete] = useState<any>(null);
  const [debtToPay, setDebtToPay] = useState<any>(null);
  const [debtForHistory, setDebtForHistory] = useState<any>(null);
  const queryClient = useQueryClient();

  // Fetch debts
  const {
    data: debts = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["debts"],
    queryFn: () => debtsApi.getAll(),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: debtsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      toast.success("Thêm công nợ thành công!");
      setIsAddModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Không thể thêm công nợ");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      debtsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      toast.success("Cập nhật công nợ thành công!");
      setIsEditModalOpen(false);
      setDebtToEdit(null);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Không thể cập nhật công nợ"
      );
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: debtsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      toast.success("Xóa công nợ thành công!");
      setIsDeleteModalOpen(false);
      setDebtToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Không thể xóa công nợ");
    },
  });

  // Pay debt mutation
  const payMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { amount: number; paymentDate?: string; note?: string };
    }) => debtsApi.makePartialPayment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      toast.success("Cập nhật công nợ thành công!");
      setIsPayModalOpen(false);
      setDebtToPay(null);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Không thể cập nhật công nợ"
      );
    },
  });

  const handleCreate = (data: any) => {
    createMutation.mutate(data);
  };

  const handleUpdate = (data: any) => {
    if (debtToEdit) {
      updateMutation.mutate({ id: debtToEdit.id, data });
    }
  };

  const handleDelete = () => {
    if (debtToDelete) {
      deleteMutation.mutate(debtToDelete.id);
    }
  };

  const handlePay = (data: {
    amount: number;
    paymentDate?: string;
    note?: string;
  }) => {
    if (debtToPay) {
      payMutation.mutate({ id: debtToPay.id, data });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const totalLend = debts
    .filter((d) => d.type === "lend")
    .reduce((sum, d) => sum + d.remainingAmount, 0);
  const totalBorrow = debts
    .filter((d) => d.type === "borrow")
    .reduce((sum, d) => sum + d.remainingAmount, 0);
  const netAmount = totalLend - totalBorrow;

  // Animated counters
  const animatedTotalLend = useCountAnimation(totalLend, 800);
  const animatedTotalBorrow = useCountAnimation(totalBorrow, 800);
  const animatedDebtsCount = useCountAnimation(debts.length, 500);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Công nợ
              </h1>
              <p className="mt-2 text-sm sm:text-base text-gray-600">
                Quản lý các khoản nợ cho và đi vay
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus className="w-5 h-5 sm:mr-2" />
              <span className="sm:inline">Thêm công nợ</span>
            </button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 card-hover animate-slideUp"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Cho vay</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(animatedTotalLend)}
                  </p>
                </div>
              </div>
            </div>

            <div
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 card-hover animate-slideUp"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <UserMinus className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Đi vay</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(animatedTotalBorrow)}
                  </p>
                </div>
              </div>
            </div>

            <div
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 card-hover animate-slideUp"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tổng số</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(animatedDebtsCount)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Debts list */}
          <div
            className="bg-white rounded-xl shadow-sm border border-gray-100 animate-slideUp"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Danh sách công nợ
              </h2>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12 text-red-600">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span>Không thể tải danh sách công nợ</span>
              </div>
            ) : debts.length === 0 ? (
              <div className="text-center py-12 animate-fadeIn">
                <div className="text-6xl mb-4 animate-bounce">💰</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Chưa có công nợ nào
                </h3>
                <p className="text-gray-600 mb-4">
                  Thêm công nợ đầu tiên của bạn
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition hover:scale-105"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Thêm công nợ
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {debts.map((debt, index) => (
                  <div
                    key={debt.id}
                    className="px-4 sm:px-6 py-4 hover:bg-gray-50 transition-all duration-200 hover:scale-[1.01] animate-fadeIn"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                        <div
                          className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${
                            debt.type === "lend" ? "bg-green-100" : "bg-red-100"
                          }`}
                        >
                          {debt.type === "lend" ? (
                            <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                          ) : (
                            <UserMinus className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-gray-900 text-sm sm:text-base">
                              {debt.personName}
                            </p>
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${
                                debt.status === "completed"
                                  ? "bg-green-100 text-green-700"
                                  : debt.status === "partial"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {debt.status === "completed"
                                ? "Hoàn thành"
                                : debt.status === "partial"
                                ? "Một phần"
                                : "Chưa trả"}
                            </span>
                          </div>
                          {debt.description && (
                            <p className="text-xs sm:text-sm text-gray-500 mt-1 break-words">
                              {debt.description}
                            </p>
                          )}
                          <div className="flex flex-col sm:flex-row sm:items-center text-xs text-gray-400 mt-2 gap-1 sm:gap-4">
                            {debt.dueDate && (
                              <span className="flex items-center whitespace-nowrap">
                                <Clock className="w-3 h-3 mr-1" />
                                Hạn:{" "}
                                {format(new Date(debt.dueDate), "dd/MM/yyyy", {
                                  locale: vi,
                                })}
                              </span>
                            )}
                            <span className="break-words">
                              Còn lại: {formatCurrency(debt.remainingAmount)} /{" "}
                              {formatCurrency(debt.amount)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                        <p
                          className={`text-base sm:text-lg font-semibold flex-1 sm:flex-none ${
                            debt.type === "lend"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {debt.type === "lend" ? "+" : "-"}
                          {formatCurrency(debt.remainingAmount)}
                        </p>
                        <div className="flex gap-1">
                          {debt.status !== "completed" && (
                            <button
                              onClick={() => {
                                setDebtToPay(debt);
                                setIsPayModalOpen(true);
                              }}
                              className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                                debt.type === "lend"
                                  ? "text-green-600 hover:bg-green-50"
                                  : "text-red-600 hover:bg-red-50"
                              }`}
                              title={debt.type === "lend" ? "Thu nợ" : "Trả nợ"}
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setDebtForHistory(debt);
                              setIsHistoryModalOpen(true);
                            }}
                            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 hover:scale-110"
                            title="Xem lịch sử góp"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setDebtToEdit(debt);
                              setIsEditModalOpen(true);
                            }}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 hover:scale-110"
                            title="Sửa công nợ"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setDebtToDelete(debt);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
                            title="Xóa công nợ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add Debt Modal */}
        <AddDebtModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleCreate}
          isLoading={createMutation.isPending}
        />

        {/* Edit Debt Modal */}
        {debtToEdit && (
          <EditDebtModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setDebtToEdit(null);
            }}
            debt={debtToEdit}
            onSubmit={handleUpdate}
            isLoading={updateMutation.isPending}
          />
        )}

        {/* Delete Confirm Modal */}
        {debtToDelete && (
          <DeleteConfirmModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setDebtToDelete(null);
            }}
            onConfirm={handleDelete}
            isLoading={deleteMutation.isPending}
            title="Xóa công nợ"
            message={`Bạn có chắc muốn xóa công nợ với "${debtToDelete.personName}"? Hành động này không thể hoàn tác.`}
          />
        )}

        {/* Pay Debt Modal */}
        {debtToPay && (
          <PayDebtModal
            isOpen={isPayModalOpen}
            onClose={() => {
              setIsPayModalOpen(false);
              setDebtToPay(null);
            }}
            debt={debtToPay}
            onSubmit={handlePay}
            isLoading={payMutation.isPending}
          />
        )}

        {/* Payment History Modal */}
        {debtForHistory && (
          <PaymentHistoryModal
            debtId={debtForHistory.id}
            debtTitle={debtForHistory.personName}
            onClose={() => {
              setIsHistoryModalOpen(false);
              setDebtForHistory(null);
            }}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
