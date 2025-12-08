"use client";

import { useState } from "react";
import Modal from "./Modal";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface AddDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    type: "lend" | "borrow";
    personName: string;
    amount: number;
    dueDate?: string;
    description?: string;
  }) => void;
  isLoading?: boolean;
}

export default function AddDebtModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: AddDebtModalProps) {
  const [formData, setFormData] = useState({
    type: "lend" as "lend" | "borrow",
    personName: "",
    amount: "",
    description: "",
    dueDate: "",
  });

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
      type: formData.type,
      personName: trimmedName,
      amount: parsedAmount,
      dueDate: formData.dueDate || undefined,
      description: formData.description?.trim() || undefined,
    });

    // Reset form
    setFormData({
      type: "lend",
      personName: "",
      amount: "",
      description: "",
      dueDate: "",
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thêm công nợ">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Debt Type Toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loại công nợ
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: "lend" })}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                formData.type === "lend"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Cho vay
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: "borrow" })}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                formData.type === "borrow"
                  ? "bg-red-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Đi vay
            </button>
          </div>
        </div>

        {/* Person Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tên người {formData.type === "lend" ? "vay" : "cho vay"}{" "}
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
            Số tiền <span className="text-red-500">*</span>
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
            Ngày hạn
          </label>
          <input
            type="date"
            name="dueDate"
            value={formData.dueDate}
            onChange={(e) =>
              setFormData({ ...formData, dueDate: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
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
            placeholder="Ghi chú về công nợ..."
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
                Đang thêm...
              </>
            ) : (
              "Thêm công nợ"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
