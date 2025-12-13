"use client";

import { useState } from "react";
import Modal from "./Modal";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface AddWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    type: string;
    balance: number;
    currency: string;
    icon?: string;
    color?: string;
  }) => void;
  isLoading?: boolean;
}

const WALLET_ICONS = [
  "💵",
  "💰",
  "💳",
  "🏦",
  "📱",
  "💎",
  "🎁",
  "👛",
  "💼",
  "🏪",
  "🏧",
  "📊",
  "💻",
  "🎯",
  "🌟",
  "⭐",
];

const WALLET_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#64748b",
];

export default function AddWalletModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: AddWalletModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "cash",
    customType: "",
    balance: "",
    currency: "VND",
    icon: "💰",
    color: "#3b82f6",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate name
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      toast.error("Vui lòng nhập tên ví");
      const nameInput = document.querySelector(
        'input[name="walletName"]'
      ) as HTMLInputElement;
      nameInput?.focus();
      return;
    }

    if (trimmedName.length < 2) {
      toast.error("Tên ví phải có ít nhất 2 ký tự");
      const nameInput = document.querySelector(
        'input[name="walletName"]'
      ) as HTMLInputElement;
      nameInput?.focus();
      return;
    }

    // Validate balance
    if (formData.balance) {
      const balanceValue = parseFloat(formData.balance);
      if (isNaN(balanceValue)) {
        toast.error("Số dư không hợp lệ");
        const balanceInput = document.querySelector(
          'input[name="balance"]'
        ) as HTMLInputElement;
        balanceInput?.focus();
        return;
      }
      if (balanceValue < 0) {
        toast.error("Số dư không được âm");
        const balanceInput = document.querySelector(
          'input[name="balance"]'
        ) as HTMLInputElement;
        balanceInput?.focus();
        return;
      }
      if (balanceValue > 1000000000000) {
        toast.error("Số dư quá lớn");
        const balanceInput = document.querySelector(
          'input[name="balance"]'
        ) as HTMLInputElement;
        balanceInput?.focus();
        return;
      }
    }

    const finalType = formData.type === "custom" ? formData.customType.trim() : formData.type;

    onSubmit({
      ...formData,
      name: trimmedName,
      type: finalType || "cash",
      balance: formData.balance ? parseFloat(formData.balance) : 0,
    });
    // Reset form
    setFormData({
      name: "",
      type: "cash",
      customType: "",
      balance: "",
      currency: "VND",
      icon: "💰",
      color: "#3b82f6",
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thêm ví mới">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Wallet Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tên ví <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="walletName"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
            placeholder="Ví dụ: Tiền mặt, Ngân hàng..."
          />
        </div>

        {/* Wallet Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Loại ví
          </label>
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: "cash" })}
              className={`flex-1 px-3 py-2 rounded-lg border transition ${formData.type === "cash"
                  ? "bg-emerald-100 border-emerald-500 text-emerald-700"
                  : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
            >
              💵 Tiền mặt
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: "electronic" })}
              className={`flex-1 px-3 py-2 rounded-lg border transition ${formData.type === "electronic"
                  ? "bg-blue-100 border-blue-500 text-blue-700"
                  : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
            >
              📱 Điện tử
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: "custom" })}
              className={`flex-1 px-3 py-2 rounded-lg border transition ${formData.type === "custom"
                  ? "bg-purple-100 border-purple-500 text-purple-700"
                  : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
            >
              ✨ Khác
            </button>
          </div>
          {formData.type === "custom" && (
            <input
              type="text"
              value={formData.customType}
              onChange={(e) =>
                setFormData({ ...formData, customType: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
              placeholder="Nhập loại ví tùy chỉnh..."
            />
          )}
        </div>

        {/* Balance */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Số dư ban đầu (để trống = 0)
          </label>
          <input
            type="number"
            name="balance"
            value={formData.balance}
            onChange={(e) =>
              setFormData({ ...formData, balance: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
            placeholder="0"
            step="1000"
          />
        </div>

        {/* Currency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Loại tiền
          </label>
          <select
            value={formData.currency}
            onChange={(e) =>
              setFormData({ ...formData, currency: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
          >
            <option value="VND">VND (₫)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>

        {/* Icon Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Biểu tượng
          </label>
          <div className="grid grid-cols-9 gap-2">
            {WALLET_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => setFormData({ ...formData, icon })}
                className={`p-2 text-2xl rounded-lg transition hover:scale-110 flex items-center justify-center ${formData.icon === icon
                    ? "bg-indigo-100 ring-2 ring-indigo-500"
                    : "bg-gray-100 hover:bg-gray-200"
                  }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Color Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Màu sắc
          </label>
          <div className="grid grid-cols-9 gap-2">
            {WALLET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ ...formData, color })}
                className={`w-10 h-10 rounded-lg transition hover:scale-110 ${formData.color === color
                    ? "ring-2 ring-gray-900 ring-offset-2"
                    : ""
                  }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
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
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang tạo...
              </>
            ) : (
              "Tạo ví"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
