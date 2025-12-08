"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import toast from "react-hot-toast";
import { goalsApi } from "@/lib/api/goals";
import type { GoalContribution } from "@/lib/types";

interface GoalContributionHistoryModalProps {
  goalId: string;
  goalName: string;
  onClose: () => void;
}

export default function GoalContributionHistoryModal({
  goalId,
  goalName,
  onClose,
}: GoalContributionHistoryModalProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: contributions, isLoading } = useQuery<GoalContribution[]>({
    queryKey: ["goal-contributions", goalId],
    queryFn: () => goalsApi.getContributions(goalId),
  });

  const deleteMutation = useMutation({
    mutationFn: (contributionId: string) =>
      goalsApi.deleteContribution(goalId, contributionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["goal", goalId] });
      queryClient.invalidateQueries({
        queryKey: ["goal-contributions", goalId],
      });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      toast.success("Xóa khoản góp thành công và đã hoàn tiền về ví");
      setDeleteId(null);
    },
    onError: () => {
      toast.error("Xóa khoản góp thất bại");
      setDeleteId(null);
    },
  });

  const handleDelete = (contributionId: string) => {
    deleteMutation.mutate(contributionId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Lịch sử đóng góp
              </h2>
              <p className="text-sm text-gray-600 mt-1">{goalName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : !contributions || contributions.length === 0 ? (
            <div className="text-center py-8">
              <svg
                className="w-16 h-16 mx-auto text-gray-300 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-500">Chưa có lịch sử đóng góp</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contributions.map((contribution) => (
                <div
                  key={contribution.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors animate-fade-in"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-semibold text-green-600">
                          {contribution.amount.toLocaleString("vi-VN")}đ
                        </span>
                        <span className="text-sm text-gray-500">
                          {format(
                            new Date(contribution.contributionDate),
                            "dd/MM/yyyy",
                            { locale: vi }
                          )}
                        </span>
                      </div>
                      {contribution.note && (
                        <p className="text-sm text-gray-600">
                          {contribution.note}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Tạo lúc:{" "}
                        {format(
                          new Date(contribution.createdAt),
                          "HH:mm dd/MM/yyyy",
                          { locale: vi }
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => setDeleteId(contribution.id)}
                      className="text-red-500 hover:text-red-700 transition-colors p-2"
                      title="Xóa và hoàn tiền"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full animate-slide-up">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Xác nhận xóa
            </h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa khoản góp này? Số tiền sẽ được hoàn trả
              về ví và số tiền đã đóng góp của mục tiêu sẽ giảm tương ứng.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
