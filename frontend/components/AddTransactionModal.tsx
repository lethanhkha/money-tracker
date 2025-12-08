"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesApi } from "@/lib/api/categories";
import { walletsApi } from "@/lib/api/wallets";
import { transactionsApi } from "@/lib/api/transactions";
import { Plus, Minus, RotateCcw, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddTransactionModal({
  isOpen,
  onClose,
}: AddTransactionModalProps) {
  const [formData, setFormData] = useState({
    type: "expense" as "income" | "expense",
    name: "",
    amount: "",
    categoryId: "",
    walletId: "",
    description: "",
    date: new Date().toISOString().slice(0, 16),
    isPending: false,
  });

  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const queryClient = useQueryClient();

  // Fetch categories based on type
  const { data: categories = [] } = useQuery({
    queryKey: ["categories", formData.type],
    queryFn: () => categoriesApi.getAll(formData.type),
  });

  // Filter out system categories
  const userCategories = categories.filter(
    (cat) => cat.name !== "Tiết kiệm" && cat.name !== "Hoàn tiền mục tiêu"
  );

  // Fetch wallets to find default "Tiền mặt"
  const { data: wallets = [] } = useQuery({
    queryKey: ["wallets"],
    queryFn: () => walletsApi.getAll(),
  });

  const defaultWallet =
    wallets.find((w) => w.name === "Tiền mặt") || wallets[0];

  // Auto-select default wallet when wallets load
  useEffect(() => {
    if (defaultWallet && !formData.walletId) {
      setFormData((prev) => ({
        ...prev,
        walletId: defaultWallet.id.toString(),
      }));
    }
  }, [defaultWallet, formData.walletId]);

  // Quick amount buttons (in VND)
  const quickAmounts = [
    { label: "+500k", value: 500000 },
    { label: "+200k", value: 200000 },
    { label: "+100k", value: 100000 },
    { label: "+50k", value: 50000 },
    { label: "+20k", value: 20000 },
    { label: "+10k", value: 10000 },
    { label: "+5k", value: 5000 },
    { label: "-5k", value: -5000 },
    { label: "-10k", value: -10000 },
    { label: "-20k", value: -20000 },
    { label: "-50k", value: -50000 },
    { label: "-100k", value: -100000 },
  ];

  const handleQuickAmount = (value: number) => {
    const currentAmount = parseFloat(formData.amount) || 0;
    const newAmount = Math.max(0, currentAmount + value);
    setFormData({ ...formData, amount: newAmount.toString() });
  };

  const resetAmount = () => {
    setFormData({ ...formData, amount: "" });
  };

  // Find selected category from categories list and formData.categoryId
  const selectedCategoryFromList = categories.find(
    (c: any) => c.id === formData.categoryId
  );
  const isTipsCategory =
    selectedCategoryFromList?.name?.toLowerCase().trim().normalize("NFC") ===
    "tiền tips".normalize("NFC");

  // Debug log
  useEffect(() => {
    if (selectedCategoryFromList) {
      const nameLower = selectedCategoryFromList.name?.toLowerCase().trim();
      const target = "tiền tips";
      console.log("Selected category:", {
        name: selectedCategoryFromList.name,
        nameLower: nameLower,
        target: target,
        isTips: nameLower === target,
        nameBytes: Array.from(nameLower || "").map((c) => c.charCodeAt(0)),
        targetBytes: Array.from(target).map((c) => c.charCodeAt(0)),
      });
    }
  }, [selectedCategoryFromList]);

  // Auto-set isPending to true for tips
  useEffect(() => {
    if (isTipsCategory && formData.type === "income") {
      setFormData((prev) => ({ ...prev, isPending: true }));
    } else if (!isTipsCategory) {
      setFormData((prev) => ({ ...prev, isPending: false }));
    }
  }, [isTipsCategory, formData.type]);

  const handleCategorySelect = (categoryId: string) => {
    const category = categories.find((c: any) => c.id === parseInt(categoryId));
    setSelectedCategory(category);
    setFormData({ ...formData, categoryId });
  };

  // Create transaction mutation
  const createMutation = useMutation({
    mutationFn: transactionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transactions-summary"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      toast.success("Thêm giao dịch thành công!");
      onClose();
      // Reset form
      setFormData({
        type: "expense",
        name: "",
        amount: "",
        categoryId: "",
        walletId: "",
        description: "",
        date: new Date().toISOString().slice(0, 16),
        isPending: false,
      });
      setSelectedCategory(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Không thể thêm giao dịch");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate amount
    if (!formData.amount || formData.amount.trim() === "") {
      toast.error("Vui lòng nhập số tiền");
      const amountInput = document.querySelector(
        'input[name="amount"]'
      ) as HTMLInputElement;
      amountInput?.focus();
      return;
    }

    const parsedAmount = parseFloat(formData.amount);
    if (isNaN(parsedAmount)) {
      toast.error("Số tiền không hợp lệ");
      const amountInput = document.querySelector(
        'input[name="amount"]'
      ) as HTMLInputElement;
      amountInput?.focus();
      return;
    }

    if (parsedAmount <= 0) {
      toast.error("Số tiền phải lớn hơn 0");
      const amountInput = document.querySelector(
        'input[name="amount"]'
      ) as HTMLInputElement;
      amountInput?.focus();
      return;
    }

    if (parsedAmount > 1000000000000) {
      toast.error("Số tiền quá lớn");
      const amountInput = document.querySelector(
        'input[name="amount"]'
      ) as HTMLInputElement;
      amountInput?.focus();
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
      const dateInput = document.querySelector(
        'input[name="transactionDate"]'
      ) as HTMLInputElement;
      dateInput?.focus();
      return;
    }

    // Validate name for non-tips transactions
    if (!isTipsCategory) {
      const trimmedName = formData.name.trim();
      if (!trimmedName) {
        toast.error("Vui lòng nhập tên giao dịch");
        const nameInput = document.querySelector(
          'input[name="transactionName"]'
        ) as HTMLInputElement;
        nameInput?.focus();
        return;
      }
      if (trimmedName.length < 2) {
        toast.error("Tên giao dịch phải có ít nhất 2 ký tự");
        const nameInput = document.querySelector(
          'input[name="transactionName"]'
        ) as HTMLInputElement;
        nameInput?.focus();
        return;
      }
    }

    // Validate wallet balance for expenses
    if (formData.type === "expense") {
      const selectedWallet = wallets.find(
        (w) => w.id.toString() === formData.walletId
      );
      if (selectedWallet && selectedWallet.balance < parsedAmount) {
        toast.error(
          `Số dư ví không đủ! Số dư hiện tại: ${new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(selectedWallet.balance)}`
        );
        return;
      }
    }

    createMutation.mutate({
      type: formData.type,
      amount: parsedAmount,
      categoryId: formData.categoryId,
      walletId: formData.walletId,
      description: isTipsCategory ? "" : formData.name,
      date: formData.date,
      status: formData.isPending ? "pending" : "completed",
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thêm giao dịch">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Transaction Type Toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loại giao dịch
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setFormData({
                  ...formData,
                  type: "expense",
                  categoryId: "",
                  isPending: false,
                });
                setSelectedCategory(null);
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                formData.type === "expense"
                  ? "bg-red-500 text-white shadow-md"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Chi tiêu
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData({
                  ...formData,
                  type: "income",
                  categoryId: "",
                  isPending: false,
                });
                setSelectedCategory(null);
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                formData.type === "income"
                  ? "bg-green-500 text-white shadow-md"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Thu nhập
            </button>
          </div>
        </div>

        {/* Name field - hidden for tips */}
        {!isTipsCategory && (
          <div className="animate-slideDown">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên giao dịch <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="transactionName"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500 transition-all duration-200"
              placeholder="Ví dụ: Mua sắm, Ăn trưa..."
            />
          </div>
        )}

        {/* Amount with Quick Buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Số tiền <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500 transition-all duration-200"
            placeholder="0"
            step="1000"
          />

          {/* Quick Amount Buttons */}
          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap gap-2">
              {quickAmounts.slice(0, 7).map((qa) => (
                <button
                  key={qa.label}
                  type="button"
                  onClick={() => handleQuickAmount(qa.value)}
                  className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all duration-200 transform hover:scale-110 font-medium shadow-sm"
                >
                  {qa.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {quickAmounts.slice(7).map((qa) => (
                <button
                  key={qa.label}
                  type="button"
                  onClick={() => handleQuickAmount(qa.value)}
                  className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-200 transform hover:scale-110 font-medium shadow-sm"
                >
                  {qa.label}
                </button>
              ))}
              <button
                type="button"
                onClick={resetAmount}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 transform hover:scale-110 font-medium flex items-center gap-1 shadow-sm"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>
          </div>
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
                onClick={() => handleCategorySelect(cat.id.toString())}
                className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200 transform hover:scale-105 ${
                  formData.categoryId === cat.id.toString()
                    ? "border-indigo-500 shadow-md"
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
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xl transform hover:rotate-12 transition-transform duration-200"
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

        {/* Default Wallet Display */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ví <span className="text-red-500">*</span>
          </label>
          <select
            name="wallet"
            value={formData.walletId}
            onChange={(e) =>
              setFormData({ ...formData, walletId: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
          >
            <option value="">Chọn ví</option>
            {wallets.map((wallet) => (
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
            Ngày giao dịch <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            name="transactionDate"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
          />
        </div>

        {/* Tips Pending Status */}
        {isTipsCategory && (
          <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="isPending"
                checked={formData.isPending}
                onChange={(e) =>
                  setFormData({ ...formData, isPending: e.target.checked })
                }
                className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="isPending" className="ml-2 text-sm text-gray-700">
                <span className="font-medium">Chờ nhận tiền tips</span>
                <p className="text-xs text-gray-600 mt-1">
                  Ngày nhận sẽ tự động là ngày giao dịch + 1 ngày
                </p>
              </label>
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ghi chú
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500 resize-none"
            placeholder="Ghi chú về giao dịch..."
            rows={3}
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={createMutation.isPending}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all duration-200 disabled:opacity-50 transform hover:scale-105"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center transform hover:scale-105 shadow-md"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang thêm...
              </>
            ) : (
              "Thêm giao dịch"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
