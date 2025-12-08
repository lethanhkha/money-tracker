"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";
import { Loader2 } from "lucide-react";
import { Wallet } from "@/lib/types";
import toast from "react-hot-toast";

interface EditWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: Wallet;
  onSubmit: (data: { name?: string; icon?: string; color?: string }) => void;
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

export default function EditWalletModal({
  isOpen,
  onClose,
  wallet,
  onSubmit,
  isLoading = false,
}: EditWalletModalProps) {
  const [formData, setFormData] = useState({
    name: wallet.name,
    icon: wallet.icon || "💰",
    color: wallet.color || "#6366f1",
  });

  useEffect(() => {
    setFormData({
      name: wallet.name,
      icon: wallet.icon || "💰",
      color: wallet.color || "#6366f1",
    });
  }, [wallet]);

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

    onSubmit({
      ...formData,
      name: trimmedName,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chỉnh sửa ví">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tên ví <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="walletName"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
            placeholder="Ví tiền mặt"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Biểu tượng
          </label>
          <div className="grid grid-cols-9 gap-3">
            {WALLET_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => setFormData({ ...formData, icon })}
                className={`p-3 text-2xl rounded-lg border-2 transition flex items-center justify-center ${
                  formData.icon === icon
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

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
                className={`w-10 h-10 rounded-lg border-2 transition ${
                  formData.color === color
                    ? "border-gray-900 scale-110"
                    : "border-gray-200 hover:scale-105"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
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
