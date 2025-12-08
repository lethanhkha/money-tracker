"use client";

import Modal from "./Modal";
import { Loader2 } from "lucide-react";

interface DeleteTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  transactionAmount?: number;
  transactionType?: "income" | "expense";
}

export default function DeleteTransactionModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  transactionAmount,
  transactionType,
}: DeleteTransactionModalProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Xác nhận xóa giao dịch">
      <div className="space-y-4">
        <p className="text-gray-700">
          Bạn có chắc chắn muốn xóa giao dịch này không?
        </p>

        {transactionAmount !== undefined && transactionType && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">
              Số tiền sẽ được hoàn trả về ví:
            </p>
            <p
              className={`text-lg font-semibold ${
                transactionType === "income" ? "text-red-600" : "text-green-600"
              }`}
            >
              {transactionType === "income" ? "-" : "+"}
              {formatCurrency(transactionAmount)}
            </p>
          </div>
        )}

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
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang xóa...
              </>
            ) : (
              "Xóa giao dịch"
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
