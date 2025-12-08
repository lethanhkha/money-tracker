"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import AddWalletModal from "@/components/AddWalletModal";
import EditWalletModal from "@/components/EditWalletModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import { walletsApi } from "@/lib/api/wallets";
import { Wallet } from "@/lib/types";
import { Plus, Edit2, Trash2, Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useCountAnimation } from "@/hooks/useCountAnimation";

export default function WalletsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [deletingWallet, setDeletingWallet] = useState<Wallet | null>(null);
  const queryClient = useQueryClient();

  // Fetch wallets
  const {
    data: wallets = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["wallets"],
    queryFn: () => walletsApi.getAll(),
  });

  // Create wallet mutation
  const createMutation = useMutation({
    mutationFn: walletsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      setIsAddModalOpen(false);
      toast.success("Thêm ví thành công!");
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.error || "Thêm ví thất bại. Vui lòng thử lại.";
      toast.error(errorMessage);
    },
  });

  // Update wallet mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      walletsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      setEditingWallet(null);
      toast.success("Cập nhật ví thành công!");
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.error ||
        "Cập nhật ví thất bại. Vui lòng thử lại.";
      toast.error(errorMessage);
    },
  });

  // Delete wallet mutation
  const deleteMutation = useMutation({
    mutationFn: walletsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      setDeletingWallet(null);
      toast.success("Xóa ví thành công!");
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Xóa ví thất bại. Vui lòng thử lại.";
      toast.error(errorMessage);
    },
  });

  // Set default wallet mutation
  const setDefaultMutation = useMutation({
    mutationFn: walletsApi.setDefault,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      toast.success("Đã đặt ví mặc định!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Không thể đặt ví mặc định");
    },
  });

  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  const animatedBalance = useCountAnimation(totalBalance, 1000);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const handleDelete = () => {
    if (deletingWallet) {
      deleteMutation.mutate(deletingWallet.id);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Page header */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Ví tiền
              </h1>
              <p className="mt-2 text-sm sm:text-base text-gray-600">
                Quản lý các ví tiền của bạn
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus className="w-5 h-5 sm:mr-2" />
              <span className="hidden sm:inline">Thêm ví</span>
            </button>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800">
                  Không thể tải danh sách ví
                </h3>
                <p className="text-sm text-red-600 mt-1">
                  {(error as any).response?.data?.error ||
                    "Đã có lỗi xảy ra. Vui lòng thử lại sau."}
                </p>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && wallets.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                <Plus className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Chưa có ví tiền nào
              </h3>
              <p className="text-gray-600 mb-4">
                Tạo ví đầu tiên để bắt đầu quản lý chi tiêu
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                <Plus className="w-5 h-5 mr-2" />
                Thêm ví mới
              </button>
            </div>
          )}

          {/* Total balance card */}
          {!isLoading && !error && wallets.length > 0 && (
            <>
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-8 text-white animate-scaleIn">
                <p className="text-sm font-medium opacity-90">Tổng số dư</p>
                <p className="mt-2 text-4xl font-bold">
                  {formatCurrency(animatedBalance)}
                </p>
                <p className="mt-2 text-sm opacity-75">
                  {wallets.length} ví tiền
                </p>
              </div>

              {/* Wallets grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wallets.map((wallet, index) => (
                  <div
                    key={wallet.id}
                    className="rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300 hover:scale-105 relative overflow-hidden animate-slideUp card-hover"
                    style={{
                      background: `linear-gradient(135deg, ${
                        wallet.color || "#6366f1"
                      } 0%, ${wallet.color || "#6366f1"}dd 100%)`,
                      animationDelay: `${0.1 + index * 0.1}s`,
                    }}
                  >
                    {/* Default badge */}
                    {wallet.isDefault && (
                      <div className="absolute bottom-4 right-4 z-10 animate-glow">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white text-gray-800 shadow-sm">
                          ★ Mặc định
                        </span>
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-4 relative z-10">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-white bg-opacity-20 backdrop-blur-sm">
                        {wallet.icon || "💰"}
                      </div>
                      <div className="flex space-x-2">
                        {!wallet.isDefault && (
                          <button
                            onClick={() => setDefaultMutation.mutate(wallet.id)}
                            disabled={setDefaultMutation.isPending}
                            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200 backdrop-blur-sm disabled:opacity-50 hover:scale-110"
                            title="Đặt làm mặc định"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => setEditingWallet(wallet)}
                          className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200 backdrop-blur-sm hover:scale-110"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingWallet(wallet)}
                          className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200 backdrop-blur-sm hover:scale-110"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1 relative z-10">
                      {wallet.name}
                    </h3>
                    <p className="text-2xl font-bold text-white relative z-10">
                      {formatCurrency(wallet.balance)}
                    </p>
                    <p className="text-sm text-white text-opacity-90 mt-1 relative z-10">
                      {wallet.currency}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Modals */}
        <AddWalletModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />

        {editingWallet && (
          <EditWalletModal
            isOpen={!!editingWallet}
            onClose={() => setEditingWallet(null)}
            wallet={editingWallet}
            onSubmit={(data) =>
              updateMutation.mutate({ id: editingWallet.id, data })
            }
            isLoading={updateMutation.isPending}
          />
        )}

        {deletingWallet && (
          <DeleteConfirmModal
            isOpen={!!deletingWallet}
            onClose={() => setDeletingWallet(null)}
            onConfirm={handleDelete}
            title="Xóa ví tiền"
            message={`Bạn có chắc chắn muốn xóa ví "${deletingWallet.name}"? Hành động này không thể hoàn tác.`}
            isLoading={deleteMutation.isPending}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
