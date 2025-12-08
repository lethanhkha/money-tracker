"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Goal } from "@/lib/types";

interface EditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal;
  onSubmit: (data: {
    name?: string;
    targetAmount?: number;
    deadline?: string;
    description?: string;
  }) => void;
  isLoading?: boolean;
}

export default function EditGoalModal({
  isOpen,
  onClose,
  goal,
  onSubmit,
  isLoading = false,
}: EditGoalModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    targetAmount: "",
    deadline: "",
    description: "",
  });

  useEffect(() => {
    if (goal) {
      setFormData({
        name: goal.name,
        targetAmount: goal.targetAmount.toString(),
        deadline: goal.deadline ? goal.deadline.split("T")[0] : "",
        description: goal.description || "",
      });
    }
  }, [goal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate name
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      toast.error("Vui lòng nhập tên mục tiêu");
      const nameInput = document.querySelector(
        'input[name="goalName"]'
      ) as HTMLInputElement;
      nameInput?.focus();
      return;
    }

    if (trimmedName.length < 2) {
      toast.error("Tên mục tiêu phải có ít nhất 2 ký tự");
      const nameInput = document.querySelector(
        'input[name="goalName"]'
      ) as HTMLInputElement;
      nameInput?.focus();
      return;
    }

    // Validate target amount
    if (!formData.targetAmount || formData.targetAmount.trim() === "") {
      toast.error("Vui lòng nhập số tiền mục tiêu");
      const targetInput = document.querySelector(
        'input[name="targetAmount"]'
      ) as HTMLInputElement;
      targetInput?.focus();
      return;
    }

    const parsedTarget = parseFloat(formData.targetAmount);
    if (isNaN(parsedTarget)) {
      toast.error("Số tiền mục tiêu không hợp lệ");
      const targetInput = document.querySelector(
        'input[name="targetAmount"]'
      ) as HTMLInputElement;
      targetInput?.focus();
      return;
    }

    if (parsedTarget <= 0) {
      toast.error("Số tiền mục tiêu phải lớn hơn 0");
      const targetInput = document.querySelector(
        'input[name="targetAmount"]'
      ) as HTMLInputElement;
      targetInput?.focus();
      return;
    }

    if (parsedTarget > 10000000000000) {
      toast.error("Số tiền mục tiêu quá lớn");
      const targetInput = document.querySelector(
        'input[name="targetAmount"]'
      ) as HTMLInputElement;
      targetInput?.focus();
      return;
    }

    if (parsedTarget < goal.currentAmount) {
      toast.error("Số tiền mục tiêu không được nhỏ hơn số tiền hiện tại");
      const targetInput = document.querySelector(
        'input[name="targetAmount"]'
      ) as HTMLInputElement;
      targetInput?.focus();
      return;
    }

    // Validate deadline if provided
    if (formData.deadline) {
      const deadline = new Date(formData.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (deadline < today) {
        toast.error("Hạn chót không được trong quá khứ");
        const deadlineInput = document.querySelector(
          'input[name="deadline"]'
        ) as HTMLInputElement;
        deadlineInput?.focus();
        return;
      }
    }

    onSubmit({
      name: trimmedName,
      targetAmount: parsedTarget,
      deadline: formData.deadline || undefined,
      description: formData.description?.trim() || undefined,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chỉnh sửa mục tiêu">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Goal Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tên mục tiêu <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="goalName"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
            placeholder="Ví dụ: Mua nhà, Du lịch..."
          />
        </div>

        {/* Target Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Số tiền mục tiêu <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="targetAmount"
            value={formData.targetAmount}
            onChange={(e) =>
              setFormData({ ...formData, targetAmount: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
            placeholder="0"
            step="1000"
          />
          <p className="mt-1 text-xs text-gray-500">
            Hiện tại:{" "}
            {new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(goal.currentAmount)}
          </p>
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hạn chót
          </label>
          <input
            type="date"
            name="deadline"
            value={formData.deadline}
            onChange={(e) =>
              setFormData({ ...formData, deadline: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mô tả
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500 resize-none"
            placeholder="Mô tả về mục tiêu..."
            rows={3}
          />
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
                Đang cập nhật...
              </>
            ) : (
              "Cập nhật"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
