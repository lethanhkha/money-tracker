"use client";

import { useState } from "react";
import Modal from "./Modal";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

interface PayDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: {
    id: string;
    personName: string;
    remainingAmount: number;
    type: "lend" | "borrow";
  };
  onSubmit: (data: {
    amount: number;
    paymentDate?: string;
    note?: string;
  }) => void;
  isLoading?: boolean;
}

export default function PayDebtModal({
  isOpen,
  onClose,
  debt,
  onSubmit,
  isLoading = false,
}: PayDebtModalProps) {
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [note, setNote] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate amount
    if (!amount || amount.trim() === "") {
      toast.error("Vui lòng nhập số tiền");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      toast.error("Số tiền không hợp lệ");
      return;
    }

    if (parsedAmount <= 0) {
      toast.error("Số tiền phải lớn hơn 0");
      return;
    }

    if (parsedAmount > debt.remainingAmount) {
      toast.error("Số tiền không được vượt quá số tiền còn lại");
      return;
    }

    onSubmit({
      amount: parsedAmount,
      paymentDate,
      note: note.trim() || undefined,
    });

    // Reset form
    setAmount("");
    setPaymentDate(format(new Date(), "yyyy-MM-dd"));
    setNote("");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${debt.type === "lend" ? "Thu nợ" : "Trả nợ"} - ${
        debt.personName
      }`}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Current Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Tổng nợ:</span>
            <span className="font-semibold text-gray-900">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(debt.remainingAmount)}
            </span>
          </div>
        </div>

        {/* Payment Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Số tiền {debt.type === "lend" ? "thu" : "trả"}{" "}
            <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="payAmount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
            placeholder="0"
            step="1000"
          />
        </div>

        {/* Payment Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ngày góp <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
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

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {[25, 50, 75, 100].map((percent) => {
            const quickAmount = Math.floor(
              (debt.remainingAmount * percent) / 100
            );
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
            className={`flex-1 px-4 py-2 text-white rounded-lg transition disabled:opacity-50 flex items-center justify-center ${
              debt.type === "lend"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              `${debt.type === "lend" ? "Thu nợ" : "Trả nợ"}`
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
