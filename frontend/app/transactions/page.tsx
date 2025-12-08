"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import AddTransactionModal from "@/components/AddTransactionModal";
import EditTransactionModal from "@/components/EditTransactionModal";
import FilterModal, { FilterState } from "@/components/FilterModal";
import DeleteTransactionModal from "@/components/DeleteTransactionModal";
import {
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
  Filter,
  Loader2,
  AlertCircle,
  Trash2,
  Edit2,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionsApi } from "@/lib/api/transactions";
import toast from "react-hot-toast";
import { useCountAnimation } from "@/hooks/useCountAnimation";

// Helper function to get this month dates
const getThisMonthDates = () => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return {
    from: formatDate(startOfMonth),
    to: formatDate(endOfMonth),
  };
};

export default function TransactionsPage() {
  const thisMonth = getThisMonthDates();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<any>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<any>(null);
  const [filters, setFilters] = useState<FilterState | null>({
    dateFrom: thisMonth.from,
    dateTo: thisMonth.to,
    type: "all",
    categories: [],
    wallets: [],
    amountFrom: "",
    amountTo: "",
  });
  const [displayLimit, setDisplayLimit] = useState(100);
  const queryClient = useQueryClient();

  // Fetch all transactions (no date limit)
  const {
    data: allTransactions = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => transactionsApi.getAll({}),
  });

  // Apply filters to transactions
  const filteredTransactions = filters
    ? allTransactions.filter((t) => {
        // Date filter (inclusive)
        const transactionDate = new Date(t.date);
        transactionDate.setHours(0, 0, 0, 0);

        if (filters.dateFrom) {
          const fromDate = new Date(filters.dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          if (transactionDate < fromDate) {
            return false;
          }
        }
        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (transactionDate > toDate) {
            return false;
          }
        }

        // Type filter
        if (filters.type !== "all" && t.type !== filters.type) {
          return false;
        }

        // Category filter
        if (
          filters.categories.length > 0 &&
          !filters.categories.includes(t.categoryId)
        ) {
          return false;
        }

        // Wallet filter
        if (
          filters.wallets.length > 0 &&
          !filters.wallets.includes(t.walletId)
        ) {
          return false;
        }

        // Amount filter
        if (filters.amountFrom && t.amount < parseFloat(filters.amountFrom)) {
          return false;
        }
        if (filters.amountTo && t.amount > parseFloat(filters.amountTo)) {
          return false;
        }

        return true;
      })
    : allTransactions;

  // Limit displayed transactions for pagination
  const transactions = filteredTransactions.slice(0, displayLimit);
  const hasMore = filteredTransactions.length > displayLimit;
  const remainingCount = filteredTransactions.length - displayLimit;

  // Calculate summary from all filtered transactions (not limited by pagination)
  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingTips = filteredTransactions
    .filter((t) => t.type === "income" && t.status === "pending")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  // Animated counters
  const animatedIncome = useCountAnimation(totalIncome, 800);
  const animatedPendingTips = useCountAnimation(pendingTips, 800);
  const animatedExpense = useCountAnimation(totalExpense, 800);

  // Mark as received mutation
  const markAsReceivedMutation = useMutation({
    mutationFn: transactionsApi.markAsReceived,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      toast.success("Đã đánh dấu nhận tiền!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Không thể cập nhật giao dịch"
      );
    },
  });

  // Delete transaction mutation
  const deleteMutation = useMutation({
    mutationFn: transactionsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      toast.success("Đã xóa giao dịch!");
      setIsDeleteModalOpen(false);
      setTransactionToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Không thể xóa giao dịch");
    },
  });

  const handleMarkAsReceived = (transactionId: string) => {
    markAsReceivedMutation.mutate(transactionId);
  };

  const handleDeleteClick = (transaction: any) => {
    setTransactionToDelete(transaction);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (transactionToDelete) {
      deleteMutation.mutate(transactionToDelete.id);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Group transactions by year, month, and day
  const groupedTransactions = transactions.reduce((acc, transaction) => {
    // For tips transactions, display date = transaction date + 1
    // For other transactions, display date = transaction date
    let displayDate;
    const isTips =
      transaction.category?.name?.toLowerCase().trim().normalize("NFC") ===
      "tiền tips".normalize("NFC");

    if (isTips) {
      // Tips: display date = transaction date + 1 day
      displayDate = toZonedTime(new Date(transaction.date), "Asia/Ho_Chi_Minh");
      displayDate.setDate(displayDate.getDate() + 1);
    } else {
      // Others: display date = transaction date
      displayDate = toZonedTime(new Date(transaction.date), "Asia/Ho_Chi_Minh");
    }

    const year = displayDate.getFullYear();
    const month = displayDate.getMonth() + 1; // 1-12
    const day = displayDate.getDate();
    const monthKey = `${year}-${String(month).padStart(2, "0")}`;
    const dayKey = `${monthKey}-${String(day).padStart(2, "0")}`;

    if (!acc[monthKey]) {
      acc[monthKey] = {
        year,
        month,
        days: {},
      };
    }
    if (!acc[monthKey].days[dayKey]) {
      acc[monthKey].days[dayKey] = {
        day,
        transactions: [],
      };
    }
    acc[monthKey].days[dayKey].transactions.push(transaction);
    return acc;
  }, {} as Record<string, { year: number; month: number; days: Record<string, { day: number; transactions: any[] }> }>);

  // Sort by year and month descending (newest first)
  const sortedGroups = Object.entries(groupedTransactions).sort(
    ([keyA], [keyB]) => keyB.localeCompare(keyA)
  );

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Giao dịch
              </h1>
              <p className="mt-2 text-sm sm:text-base text-gray-600">
                Quản lý tất cả các giao dịch thu chi
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setIsFilterModalOpen(true)}
                className="flex items-center px-3 sm:px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                <Filter className="w-5 h-5 sm:mr-2" />
                <span className="sm:inline">Lọc</span>
                {filters && (
                  <span className="ml-2 w-2 h-2 bg-indigo-500 rounded-full"></span>
                )}
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                <Plus className="w-5 h-5 sm:mr-2" />
                <span className="sm:inline">Thêm GD</span>
              </button>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 card-hover animate-slideUp"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <ArrowUpCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Thu nhập</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(animatedIncome)}
                  </p>
                </div>
              </div>
            </div>

            <div
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 card-hover animate-slideUp"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <ArrowUpCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Tips chờ nhận
                  </p>
                  <p className="text-2xl font-bold text-amber-600">
                    {formatCurrency(animatedPendingTips)}
                  </p>
                </div>
              </div>
            </div>

            <div
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 card-hover animate-slideUp"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <ArrowDownCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Chi tiêu</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(animatedExpense)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions list */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Danh sách giao dịch
              </h2>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12 text-red-600">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span>Không thể tải danh sách giao dịch</span>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Chưa có giao dịch nào
                </h3>
                <p className="text-gray-600 mb-4">
                  Thêm giao dịch đầu tiên của bạn
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Thêm giao dịch
                </button>
              </div>
            ) : (
              <div>
                {sortedGroups.map(([key, group], groupIndex) => (
                  <div
                    key={key}
                    className="border-b border-gray-100 last:border-0 animate-slideUp"
                    style={{ animationDelay: `${0.1 + groupIndex * 0.05}s` }}
                  >
                    {/* Month/Year Header */}
                    <div className="bg-indigo-50 px-6 py-3 sticky top-0 z-10 border-b-2 border-indigo-200">
                      <h3 className="text-base font-bold text-indigo-900 uppercase tracking-wide">
                        📅 Tháng {group.month}/{group.year}
                      </h3>
                    </div>

                    {/* Days in this month */}
                    {Object.entries(group.days)
                      .sort(([keyA], [keyB]) => keyB.localeCompare(keyA))
                      .map(([dayKey, dayGroup], dayIndex) => (
                        <div
                          key={dayKey}
                          className="animate-fadeIn"
                          style={{
                            animationDelay: `${0.2 + dayIndex * 0.03}s`,
                          }}
                        >
                          {/* Day Header */}
                          <div className="bg-white px-6 py-2 border-b border-gray-200">
                            <p className="text-sm font-semibold text-gray-700">
                              {format(
                                new Date(
                                  group.year,
                                  group.month - 1,
                                  dayGroup.day
                                ),
                                "EEEE, dd/MM/yyyy",
                                { locale: vi }
                              )}
                            </p>
                          </div>

                          {/* Transactions in this day */}
                          <div className="divide-y divide-gray-100">
                            {dayGroup.transactions
                              .sort(
                                (a, b) =>
                                  new Date(b.date).getTime() -
                                  new Date(a.date).getTime()
                              )
                              .map((transaction, txIndex) => (
                                <div
                                  key={transaction.id}
                                  className="px-6 py-4 hover:bg-gray-50 transition-all duration-200 hover:scale-[1.01]"
                                  style={{
                                    animationDelay: `${0.25 + txIndex * 0.02}s`,
                                  }}
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start space-x-4 flex-1 min-w-0">
                                      <div
                                        className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                                        style={{
                                          backgroundColor: transaction.category
                                            ?.color
                                            ? `${transaction.category.color}40`
                                            : transaction.type === "income"
                                            ? "#dcfce7"
                                            : "#fee2e2",
                                        }}
                                      >
                                        {transaction.category?.icon ||
                                          (transaction.type === "income"
                                            ? "💰"
                                            : "💸")}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          {transaction.description && (
                                            <span className="text-sm font-medium text-gray-900">
                                              {transaction.description}
                                            </span>
                                          )}
                                          <div
                                            className="inline-flex items-center px-2 py-1 rounded-lg text-sm font-medium"
                                            style={{
                                              backgroundColor: transaction
                                                .category?.color
                                                ? `${transaction.category.color}20`
                                                : "#f3f4f6",
                                              color: "#111827",
                                            }}
                                          >
                                            {transaction.category?.name ||
                                              "Không có danh mục"}
                                          </div>
                                          {transaction.status === "pending" && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                              Chờ nhận
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-sm text-gray-500 truncate">
                                          {transaction.wallet?.name ||
                                            "Không có ví"}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                          <p className="text-xs text-gray-400">
                                            {(() => {
                                              const isTips =
                                                transaction.category?.name
                                                  ?.toLowerCase()
                                                  .trim()
                                                  .normalize("NFC") ===
                                                "tiền tips".normalize("NFC");

                                              // Convert UTC to GMT+7 timezone
                                              const transactionDate =
                                                toZonedTime(
                                                  new Date(transaction.date),
                                                  "Asia/Ho_Chi_Minh"
                                                );

                                              // For tips, display date + 1 day
                                              if (isTips) {
                                                const displayDate = new Date(
                                                  transactionDate
                                                );
                                                displayDate.setDate(
                                                  displayDate.getDate() + 1
                                                );
                                                return format(
                                                  displayDate,
                                                  "dd/MM/yyyy HH:mm",
                                                  {
                                                    locale: vi,
                                                  }
                                                );
                                              }

                                              // For others, display transaction date
                                              return format(
                                                transactionDate,
                                                "dd/MM/yyyy HH:mm",
                                                {
                                                  locale: vi,
                                                }
                                              );
                                            })()}
                                          </p>
                                          {transaction.category?.name
                                            ?.toLowerCase()
                                            .trim()
                                            .normalize("NFC") ===
                                            "tiền tips".normalize("NFC") && (
                                            <span className="text-xs text-gray-400">
                                              • Làm việc:{" "}
                                              {format(
                                                toZonedTime(
                                                  new Date(transaction.date),
                                                  "Asia/Ho_Chi_Minh"
                                                ),
                                                "dd/MM",
                                                {
                                                  locale: vi,
                                                }
                                              )}
                                            </span>
                                          )}
                                        </div>
                                        {transaction.status === "pending" && (
                                          <button
                                            onClick={() =>
                                              handleMarkAsReceived(
                                                transaction.id
                                              )
                                            }
                                            disabled={
                                              markAsReceivedMutation.isPending
                                            }
                                            className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50 hover:animate-successPulse transition-all"
                                          >
                                            {markAsReceivedMutation.isPending
                                              ? "Đang xử lý..."
                                              : "✓ Đánh dấu đã nhận"}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <p
                                        className={`text-lg font-semibold ${
                                          transaction.type === "income"
                                            ? "text-green-600"
                                            : "text-red-600"
                                        }`}
                                      >
                                        {transaction.type === "income"
                                          ? "+"
                                          : "-"}
                                        {formatCurrency(transaction.amount)}
                                      </p>
                                      <div className="flex gap-1 mt-2 justify-end">
                                        <button
                                          onClick={() => {
                                            setTransactionToEdit(transaction);
                                            setIsEditModalOpen(true);
                                          }}
                                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                          title="Sửa giao dịch"
                                        >
                                          <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleDeleteClick(transaction)
                                          }
                                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                          title="Xóa giao dịch"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                  </div>
                ))}

                {/* Load More Button */}
                {hasMore && (
                  <div className="px-6 py-6 border-t border-gray-200 bg-gray-50">
                    <button
                      onClick={() => setDisplayLimit((prev) => prev + 100)}
                      className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                    >
                      Tải thêm ({remainingCount.toLocaleString()} giao dịch)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Add Transaction Modal */}
        <AddTransactionModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />

        {/* Edit Transaction Modal */}
        {transactionToEdit && (
          <EditTransactionModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setTransactionToEdit(null);
            }}
            transaction={transactionToEdit}
          />
        )}

        {/* Filter Modal */}
        <FilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          onApplyFilter={(newFilters) => {
            setFilters(newFilters);
            console.log("Applied filters:", newFilters);
          }}
        />

        {/* Delete Transaction Modal */}
        <DeleteTransactionModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setTransactionToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          isLoading={deleteMutation.isPending}
          transactionAmount={transactionToDelete?.amount}
          transactionType={transactionToDelete?.type}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
