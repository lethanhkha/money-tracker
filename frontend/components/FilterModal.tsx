"use client";

import { useState } from "react";
import Modal from "./Modal";
import { useQuery } from "@tanstack/react-query";
import { categoriesApi } from "@/lib/api/categories";
import { walletsApi } from "@/lib/api/wallets";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilter: (filters: FilterState) => void;
}

export interface FilterState {
  dateFrom: string;
  dateTo: string;
  type: "all" | "income" | "expense";
  categories: string[];
  wallets: string[];
  amountFrom: string;
  amountTo: string;
}

// Helper functions for date ranges
const getThisWeekDates = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();

  // Calculate start of week (Monday)
  const startOfWeek = new Date(today);
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  startOfWeek.setDate(today.getDate() - daysToSubtract);

  // Calculate end of week (Sunday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  // Format to YYYY-MM-DD in local timezone
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return {
    from: formatDate(startOfWeek),
    to: formatDate(endOfWeek),
  };
};

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

const getThisYearDates = () => {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const endOfYear = new Date(today.getFullYear(), 11, 31);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return {
    from: formatDate(startOfYear),
    to: formatDate(endOfYear),
  };
};

export default function FilterModal({
  isOpen,
  onClose,
  onApplyFilter,
}: FilterModalProps) {
  const thisMonth = getThisMonthDates();
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: thisMonth.from,
    dateTo: thisMonth.to,
    type: "all",
    categories: [],
    wallets: [],
    amountFrom: "",
    amountTo: "",
  });

  // Fetch all categories
  const { data: allCategories = [] } = useQuery({
    queryKey: ["categories-all"],
    queryFn: async () => {
      const income = await categoriesApi.getAll("income");
      const expense = await categoriesApi.getAll("expense");
      const all = [
        ...income.map((c: any) => ({ ...c, type: "income" })),
        ...expense.map((c: any) => ({ ...c, type: "expense" })),
      ];
      // Filter out system categories
      return all.filter(
        (cat: any) =>
          cat.name !== "Tiết kiệm" && cat.name !== "Hoàn tiền mục tiêu"
      );
    },
  });

  // Fetch wallets
  const { data: wallets = [] } = useQuery({
    queryKey: ["wallets"],
    queryFn: () => walletsApi.getAll(),
  });

  const handleReset = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      type: "all",
      categories: [],
      wallets: [],
      amountFrom: "",
      amountTo: "",
    });
  };

  const handleQuickFilter = (period: "week" | "month" | "year") => {
    let dates;
    switch (period) {
      case "week":
        dates = getThisWeekDates();
        break;
      case "month":
        dates = getThisMonthDates();
        break;
      case "year":
        dates = getThisYearDates();
        break;
    }
    setFilters((prev) => ({
      ...prev,
      dateFrom: dates.from,
      dateTo: dates.to,
    }));
  };

  const handleApply = () => {
    onApplyFilter(filters);
    onClose();
  };

  const toggleCategory = (categoryId: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter((id) => id !== categoryId)
        : [...prev.categories, categoryId],
    }));
  };

  const toggleWallet = (walletId: string) => {
    setFilters((prev) => ({
      ...prev,
      wallets: prev.wallets.includes(walletId)
        ? prev.wallets.filter((id) => id !== walletId)
        : [...prev.wallets, walletId],
    }));
  };

  const filteredCategories =
    filters.type === "all"
      ? allCategories
      : allCategories.filter((cat: any) => cat.type === filters.type);

  // Check which quick filter is active
  const weekDates = getThisWeekDates();
  const monthDates = getThisMonthDates();
  const yearDates = getThisYearDates();

  const isWeekActive =
    filters.dateFrom === weekDates.from && filters.dateTo === weekDates.to;
  const isMonthActive =
    filters.dateFrom === monthDates.from && filters.dateTo === monthDates.to;
  const isYearActive =
    filters.dateFrom === yearDates.from && filters.dateTo === yearDates.to;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Lọc giao dịch">
      <div className="space-y-5">
        {/* Quick Filters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bộ lọc nhanh
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleQuickFilter("week")}
              className={`flex-1 py-2 px-3 rounded-lg font-medium transition text-sm ${
                isWeekActive
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Tuần này
            </button>
            <button
              type="button"
              onClick={() => handleQuickFilter("month")}
              className={`flex-1 py-2 px-3 rounded-lg font-medium transition text-sm ${
                isMonthActive
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Tháng này
            </button>
            <button
              type="button"
              onClick={() => handleQuickFilter("year")}
              className={`flex-1 py-2 px-3 rounded-lg font-medium transition text-sm ${
                isYearActive
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Năm nay
            </button>
          </div>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Khoảng thời gian
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Từ ngày
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) =>
                  setFilters({ ...filters, dateFrom: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Đến ngày
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) =>
                  setFilters({ ...filters, dateTo: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white text-sm"
              />
            </div>
          </div>
        </div>

        {/* Transaction Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loại giao dịch
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                setFilters({ ...filters, type: "all", categories: [] })
              }
              className={`flex-1 py-2 px-3 rounded-lg font-medium transition text-sm ${
                filters.type === "all"
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() =>
                setFilters({ ...filters, type: "income", categories: [] })
              }
              className={`flex-1 py-2 px-3 rounded-lg font-medium transition text-sm ${
                filters.type === "income"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Thu nhập
            </button>
            <button
              type="button"
              onClick={() =>
                setFilters({ ...filters, type: "expense", categories: [] })
              }
              className={`flex-1 py-2 px-3 rounded-lg font-medium transition text-sm ${
                filters.type === "expense"
                  ? "bg-red-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Chi tiêu
            </button>
          </div>
        </div>

        {/* Categories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Danh mục
          </label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
            {filteredCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => toggleCategory(category.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  filters.categories.includes(category.id)
                    ? "bg-indigo-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Wallets */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ví
          </label>
          <div className="flex flex-wrap gap-2">
            {wallets.map((wallet: any) => (
              <button
                key={wallet.id}
                type="button"
                onClick={() => toggleWallet(wallet.id.toString())}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  filters.wallets.includes(wallet.id.toString())
                    ? "bg-indigo-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {wallet.icon} {wallet.name}
              </button>
            ))}
          </div>
        </div>

        {/* Amount Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Khoảng số tiền
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Từ</label>
              <input
                type="number"
                value={filters.amountFrom}
                onChange={(e) =>
                  setFilters({ ...filters, amountFrom: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500 text-sm"
                placeholder="0"
                step="10000"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Đến</label>
              <input
                type="number"
                value={filters.amountTo}
                onChange={(e) =>
                  setFilters({ ...filters, amountTo: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500 text-sm"
                placeholder="0"
                step="10000"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            Đặt lại
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Áp dụng
          </button>
        </div>
      </div>
    </Modal>
  );
}
