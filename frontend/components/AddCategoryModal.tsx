"use client";

import { useState, useRef } from "react";
import Modal from "./Modal";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; icon?: string; color?: string }) => void;
  isLoading?: boolean;
  type: "income" | "expense";
}

const CATEGORY_ICONS = [
  "💰",
  "💵",
  "💸",
  "💳",
  "🏦",
  "📱",
  "💎",
  "🎁",
  "👛",
  "💼",
  "🍔",
  "🍜",
  "☕",
  "🛍️",
  "🚗",
  "🏠",
  "🏥",
  "📚",
  "🎮",
  "✈️",
  "💊",
  "⚽",
  "🎬",
  "🎵",
  "📊",
  "💻",
  "🔧",
  "🎯",
  "🌟",
  "⭐",
];

const CATEGORY_COLORS = [
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

export default function AddCategoryModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  type,
}: AddCategoryModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    icon: type === "income" ? "💰" : "🍔",
    color: type === "income" ? "#10b981" : "#ef4444",
  });
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate tên category
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      toast.error("Vui lòng nhập tên phân loại");
      nameInputRef.current?.focus();
      return;
    }

    if (trimmedName.length < 2) {
      toast.error("Tên phân loại phải có ít nhất 2 ký tự");
      nameInputRef.current?.focus();
      return;
    }

    onSubmit({ ...formData, name: trimmedName });
    // Reset form
    setFormData({
      name: "",
      icon: type === "income" ? "💰" : "🍔",
      color: type === "income" ? "#10b981" : "#ef4444",
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thêm phân loại mới">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Category Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tên phân loại <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="categoryName"
            ref={nameInputRef}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
            placeholder="Ví dụ: Ăn uống, Lương..."
          />
        </div>

        {/* Icon Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Biểu tượng
          </label>
          <div className="grid grid-cols-9 gap-2 max-h-40 overflow-y-auto">
            {CATEGORY_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => setFormData({ ...formData, icon })}
                className={`p-2 text-2xl rounded-lg transition hover:scale-110 flex items-center justify-center ${
                  formData.icon === icon
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
          <div className="grid grid-cols-9 gap-3">
            {CATEGORY_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ ...formData, color })}
                className={`w-10 h-10 rounded-lg transition hover:scale-110 ${
                  formData.color === color
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
              "Tạo phân loại"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
