"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesApi } from "@/lib/api/categories";
import { walletsApi } from "@/lib/api/wallets";
import { transactionsApi } from "@/lib/api/transactions";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
}

export default function EditTransactionModal({
  isOpen,
  onClose,
  transaction,
}: EditTransactionModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    categoryId: "",
    walletId: "",
    description: "",
    date: "",
    isPending: false,
  });

  const queryClient = useQueryClient();

  // Fetch categories based on type
  const { data: categories = [] } = useQuery({
    queryKey: ["categories", transaction?.type],
    queryFn: () => categoriesApi.getAll(transaction?.type),
    enabled: !!transaction,
  });

  // Filter out system categories
  const userCategories = categories.filter(
    (cat) => cat.name !== "Tiết kiệm" && cat.name !== "Hoàn tiền mục tiêu"
  );

  // Fetch wallets
  const { data: wallets = [] } = useQuery({
    queryKey: ["wallets"],
    queryFn: () => walletsApi.getAll(),
  });

  // Initialize form data when transaction changes
  useEffect(() => {
    if (transaction) {
      setFormData({
        name: transaction.description || "",
        amount: transaction.amount.toString(),
        categoryId: transaction.categoryId?.toString() || "",
        walletId: transaction.walletId?.toString() || "",
        description: transaction.description || "",
        date: transaction.date
          ? new Date(transaction.date).toISOString().slice(0, 16)
          : "",
        isPending: transaction.status === "pending",
      });
    }
  }, [transaction]);

  const selectedCategory = categories.find(
    (c: any) => c.id === formData.categoryId
  );
  const isTipsCategory =
    selectedCategory?.name?.toLowerCase().trim().normalize("NFC") ===
    "tiền tips".normalize("NFC");

  // Debug log
  useEffect(() => {
    if (selectedCategory) {
      console.log("Edit - Selected category:", {
        name: selectedCategory.name,
        nameLower: selectedCategory.name?.toLowerCase().trim(),
        isTips: selectedCategory.name?.toLowerCase().trim() === "tiền tips",
      });
    }
  }, [selectedCategory]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => transactionsApi.update(transaction.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      toast.success("Cập nhật giao dịch thành công!");
      onClose();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Không thể cập nhật giao dịch"
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate name for non-tips transactions
    if (!isTipsCategory) {
      const trimmedName = formData.name.trim();
      if (!trimmedName) {
        toast.error("Vui lòng nhập tên giao dịch");
        return;
      }
      if (trimmedName.length < 2) {
        toast.error("Tên giao dịch phải có ít nhất 2 ký tự");
        return;
      }
    }

    // Validate amount
    if (!formData.amount || formData.amount.trim() === "") {
      toast.error("Vui lòng nhập số tiền");
      return;
    }

    const parsedAmount = parseFloat(formData.amount);
    if (isNaN(parsedAmount)) {
      toast.error("Số tiền không hợp lệ");
      return;
    }

    if (parsedAmount <= 0) {
      toast.error("Số tiền phải lớn hơn 0");
      return;
    }

    if (parsedAmount > 1000000000000) {
      toast.error("Số tiền quá lớn");
      return;
    }

    // Validate category
    if (!formData.categoryId) {
      toast.error("Vui lòng chọn danh mục");
      return;
    }

    // Validate wallet
    if (!formData.walletId) {
      toast.error("Vui lòng chọn ví");
      return;
    }

    // Validate date
    if (!formData.date) {
      toast.error("Vui lòng chọn ngày giao dịch");
      return;
    }

    updateMutation.mutate({
      amount: parsedAmount,
      categoryId: formData.categoryId,
      walletId: formData.walletId,
      description: isTipsCategory ? "" : formData.name,
      date: formData.date,
      status: formData.isPending ? "pending" : "completed",
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sửa giao dịch">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name field - hidden for tips */}
        {!isTipsCategory && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên giao dịch <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
              placeholder="Ví dụ: Mua sắm, Ăn trưa..."
            />
          </div>
        )}

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Số tiền <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
            placeholder="0"
            step="1000"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Danh mục <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-scroll">
            {userCategories.map((cat: any) => (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  setFormData({ ...formData, categoryId: cat.id.toString() })
                }
                className={`flex items-center gap-2 p-3 rounded-lg border-2 transition ${
                  formData.categoryId === cat.id.toString()
                    ? "border-indigo-500"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                style={{
                  backgroundColor:
                    formData.categoryId === cat.id.toString()
                      ? `${cat.color}20`
                      : "white",
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xl"
                  style={{ backgroundColor: `${cat.color}40` }}
                >
                  {cat.icon}
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Wallet */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ví <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.walletId}
            onChange={(e) =>
              setFormData({ ...formData, walletId: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
          >
            <option value="">Chọn ví</option>
            {wallets.map((wallet: any) => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.icon} {wallet.name} -{" "}
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(wallet.balance)}
              </option>
            ))}
          </select>
        </div>

        {/* Date and Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ngày và giờ giao dịch <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
          />
        </div>

        {/* Tips Pending Status */}
        {isTipsCategory && transaction?.type === "income" && (
          <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="isPendingEdit"
                checked={formData.isPending}
                onChange={(e) =>
                  setFormData({ ...formData, isPending: e.target.checked })
                }
                className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label
                htmlFor="isPendingEdit"
                className="ml-2 text-sm text-gray-700"
              >
                <span className="font-medium">Chờ nhận tiền tips</span>
              </label>
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={updateMutation.isPending}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              "Lưu thay đổi"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
