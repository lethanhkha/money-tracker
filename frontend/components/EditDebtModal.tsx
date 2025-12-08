"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Debt } from "@/lib/types";

interface EditDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: Debt;
  onSubmit: (data: {
    personName?: string;
    amount?: number;
    dueDate?: string;
    description?: string;
  }) => void;
  isLoading?: boolean;
}

export default function EditDebtModal({
  isOpen,
  onClose,
  debt,
  onSubmit,
  isLoading = false,
}: EditDebtModalProps) {
  const [formData, setFormData] = useState({
    personName: "",
    amount: "",
    dueDate: "",
    description: "",
  });

  useEffect(() => {
    if (debt) {
      setFormData({
        personName: debt.personName,
        amount: debt.amount.toString(),
        dueDate: debt.dueDate ? debt.dueDate.split("T")[0] : "",
        description: debt.description || "",
      });
    }
  }, [debt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate person name
    const trimmedName = formData.personName.trim();
    if (!trimmedName) {
      toast.error("Vui lòng nhập tên người");
      const nameInput = document.querySelector(
        'input[name="personName"]'
      ) as HTMLInputElement;
      nameInput?.focus();
      return;
    }

    if (trimmedName.length < 2) {
      toast.error("Tên người phải có ít nhất 2 ký tự");
      const nameInput = document.querySelector(
        'input[name="personName"]'
      ) as HTMLInputElement;
      nameInput?.focus();
      return;
    }

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

    if (parsedAmount < debt.remainingAmount) {
      toast.error("Số tiền gốc không được nhỏ hơn số tiền còn lại");
      const amountInput = document.querySelector(
        'input[name="amount"]'
      ) as HTMLInputElement;
      amountInput?.focus();
      return;
    }

    // Validate due date if provided
    if (formData.dueDate) {
      const dueDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dueDate < today) {
        toast.error("Ngày hạn không được trong quá khứ");
        const dateInput = document.querySelector(
          'input[name="dueDate"]'
        ) as HTMLInputElement;
        dateInput?.focus();
        return;
      }
    }

    onSubmit({
      personName: trimmedName,
      amount: parsedAmount,
      dueDate: formData.dueDate || undefined,
      description: formData.description?.trim() || undefined,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sửa công nợ">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type Display (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loại công nợ
          </label>
          <div
            className={`py-2 px-4 rounded-lg font-medium text-center ${
              debt.type === "lend"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {debt.type === "lend" ? "Cho vay" : "Đi vay"}
          </div>
        </div>

        {/* Person Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tên người {debt.type === "lend" ? "vay" : "cho vay"}{" "}
            <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="personName"
            value={formData.personName}
            onChange={(e) =>
              setFormData({ ...formData, personName: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
            placeholder="Nhập tên..."
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Số tiền gốc <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
            placeholder="0"
            step="1000"
          />
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hạn trả (tuỳ chọn)
          </label>
          <input
            type="date"
            name="dueDate"
            value={formData.dueDate}
            onChange={(e) =>
              setFormData({ ...formData, dueDate: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
          />
        </div>

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
            placeholder="Ghi chú về khoản nợ..."
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
