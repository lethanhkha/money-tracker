"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import { walletsApi } from "@/lib/api/wallets";
import { format } from "date-fns";

interface ContributeGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
  };
  onSubmit: (data: {
    amount: number;
    walletId: string;
    contributionDate?: string;
    note?: string;
  }) => void;
  isLoading?: boolean;
}

export default function ContributeGoalModal({
  isOpen,
  onClose,
  goal,
  onSubmit,
  isLoading = false,
}: ContributeGoalModalProps) {
  const [amount, setAmount] = useState("");
  const [contributionDate, setContributionDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [note, setNote] = useState("");

  const { data: wallets = [] } = useQuery({
    queryKey: ["wallets"],
    queryFn: () => walletsApi.getAll(),
  });

  const [selectedWalletId, setSelectedWalletId] = useState(() => {
    return wallets.length > 0 ? wallets[0].id : "";
  });

  useEffect(() => {
    if (wallets.length > 0 && !selectedWalletId) {
      setSelectedWalletId(wallets[0].id);
    }
  }, [wallets.length]);

  const remaining = goal.targetAmount - goal.currentAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate amount
    if (!amount || amount.trim() === "") {
      toast.error("Vui lòng nhập số tiền");
      const amountInput = document.querySelector(
        'input[name="contributeAmount"]'
      ) as HTMLInputElement;
      amountInput?.focus();
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      toast.error("Số tiền không hợp lệ");
      const amountInput = document.querySelector(
        'input[name="contributeAmount"]'
      ) as HTMLInputElement;
      amountInput?.focus();
      return;
    }

    if (parsedAmount <= 0) {
      toast.error("Số tiền phải lớn hơn 0");
      const amountInput = document.querySelector(
        'input[name="contributeAmount"]'
      ) as HTMLInputElement;
      amountInput?.focus();
      return;
    }

    if (parsedAmount >= 10000000000000) {
      toast.error("Số tiền không được vượt quá 10 nghìn tỷ");
      const amountInput = document.querySelector(
        'input[name="contributeAmount"]'
      ) as HTMLInputElement;
      amountInput?.focus();
      return;
    }

    if (parsedAmount > remaining) {
      toast.error("Số tiền không được vượt quá số tiền còn lại");
      const amountInput = document.querySelector(
        'input[name="contributeAmount"]'
      ) as HTMLInputElement;
      amountInput?.focus();
      return;
    }

    if (!selectedWalletId) {
      toast.error("Vui lòng chọn ví");
      return;
    }

    // Validate wallet balance
    const selectedWallet = wallets.find((w) => w.id === selectedWalletId);
    if (!selectedWallet) {
      toast.error("Ví không tồn tại");
      return;
    }

    if (selectedWallet.balance < parsedAmount) {
      toast.error(
        `Số dư ví không đủ. Hiện có: ${new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(selectedWallet.balance)}`
      );
      const amountInput = document.querySelector(
        'input[name="contributeAmount"]'
      ) as HTMLInputElement;
      amountInput?.focus();
      return;
    }

    onSubmit({
      amount: parsedAmount,
      walletId: selectedWalletId,
      contributionDate,
      note: note.trim() || undefined,
    });

    // Reset form
    setAmount("");
    setContributionDate(format(new Date(), "yyyy-MM-dd"));
    setNote("");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Đóng góp - ${goal.name}`}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Current Info */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Đã đạt:</span>
            <span className="font-semibold text-gray-900">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(goal.currentAmount)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Mục tiêu:</span>
            <span className="font-semibold text-gray-900">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(goal.targetAmount)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-700">Còn lại:</span>
            <span className="font-bold text-indigo-600">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(remaining)}
            </span>
          </div>
        </div>

        {/* Contribute Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Số tiền đóng góp <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="contributeAmount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
            placeholder="0"
            step="1000"
          />
        </div>

        {/* Contribution Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ngày góp <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={contributionDate}
            onChange={(e) => setContributionDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
          />
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ghi chú
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
            placeholder="Thêm ghi chú (tùy chọn)"
          />
        </div>

        {/* Wallet Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ví <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedWalletId}
            onChange={(e) => setSelectedWalletId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
          >
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

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {[25, 50, 75, 100].map((percent) => {
            const quickAmount = Math.floor((remaining * percent) / 100);
            return (
              <button
                key={percent}
                type="button"
                onClick={() => setAmount(quickAmount.toString())}
                className="px-3 py-2 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                {percent}%
              </button>
            );
          })}
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              "Đóng góp"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
