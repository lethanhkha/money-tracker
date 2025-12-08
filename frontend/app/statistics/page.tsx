"use client";

import { useState, useMemo } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Calendar,
  PieChart,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { transactionsApi } from "@/lib/api/transactions";
import { categoriesApi } from "@/lib/api/categories";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  eachMonthOfInterval,
  subWeeks,
  subMonths,
  subYears,
  isSameDay,
  isSameMonth,
} from "date-fns";
import { vi } from "date-fns/locale";
import { useCountAnimation } from "@/lib/hooks/useCountAnimation";

type PeriodType = "week" | "month" | "year";

export default function StatisticsPage() {
  const now = new Date();
  const [period, setPeriod] = useState<PeriodType>("month");
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Fetch all transactions
  const { data: allTransactions = [], isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => transactionsApi.getAll(),
  });

  // Fetch all categories
  const { data: allCategories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories-all"],
    queryFn: async () => {
      const income = await categoriesApi.getAll("income");
      const expense = await categoriesApi.getAll("expense");
      return [
        ...income.map((c: any) => ({ ...c, type: "income" })),
        ...expense.map((c: any) => ({ ...c, type: "expense" })),
      ];
    },
  });

  // Calculate statistics based on selected period
  const statistics = useMemo(() => {
    const referenceDate = new Date(selectedYear, selectedMonth - 1, 1);
    let currentStart: Date,
      currentEnd: Date,
      previousStart: Date,
      previousEnd: Date;
    let chartData: Array<{ label: string; income: number; expense: number }> =
      [];

    if (period === "week") {
      // Tính tuần dựa trên selectedWeek (1-4)
      const firstDayOfMonth = new Date(selectedYear, selectedMonth - 1, 1);
      const weekOffset = (selectedWeek - 1) * 7;
      const weekStart = new Date(firstDayOfMonth);
      weekStart.setDate(weekStart.getDate() + weekOffset);

      currentStart = startOfWeek(weekStart, { weekStartsOn: 1 });
      currentEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      previousStart = startOfWeek(subWeeks(weekStart, 1), { weekStartsOn: 1 });
      previousEnd = endOfWeek(subWeeks(weekStart, 1), { weekStartsOn: 1 });

      // Chart data: each day of the week
      const days = eachDayOfInterval({ start: currentStart, end: currentEnd });
      chartData = days.map((day) => {
        const dayTransactions = allTransactions.filter((t) =>
          isSameDay(new Date(t.date), day)
        );
        return {
          label: format(day, "EEE", { locale: vi }),
          income: dayTransactions
            .filter((t) => t.type === "income" && t.status === "completed")
            .reduce((sum, t) => sum + t.amount, 0),
          expense: dayTransactions
            .filter((t) => t.type === "expense")
            .reduce((sum, t) => sum + t.amount, 0),
        };
      });
    } else if (period === "month") {
      currentStart = startOfMonth(referenceDate);
      currentEnd = endOfMonth(referenceDate);
      previousStart = startOfMonth(subMonths(referenceDate, 1));
      previousEnd = endOfMonth(subMonths(referenceDate, 1));

      // Chart data: each day of the month
      const days = eachDayOfInterval({ start: currentStart, end: currentEnd });
      chartData = days.map((day) => {
        const dayTransactions = allTransactions.filter((t) =>
          isSameDay(new Date(t.date), day)
        );
        return {
          label: format(day, "d"),
          income: dayTransactions
            .filter((t) => t.type === "income" && t.status === "completed")
            .reduce((sum, t) => sum + t.amount, 0),
          expense: dayTransactions
            .filter((t) => t.type === "expense")
            .reduce((sum, t) => sum + t.amount, 0),
        };
      });
    } else {
      // year
      currentStart = startOfYear(referenceDate);
      currentEnd = endOfYear(referenceDate);
      previousStart = startOfYear(subYears(referenceDate, 1));
      previousEnd = endOfYear(subYears(referenceDate, 1));

      // Chart data: each month of the year
      const months = eachMonthOfInterval({
        start: currentStart,
        end: currentEnd,
      });
      chartData = months.map((month) => {
        const monthTransactions = allTransactions.filter((t) =>
          isSameMonth(new Date(t.date), month)
        );
        return {
          label: format(month, "MMM", { locale: vi }),
          income: monthTransactions
            .filter((t) => t.type === "income" && t.status === "completed")
            .reduce((sum, t) => sum + t.amount, 0),
          expense: monthTransactions
            .filter((t) => t.type === "expense" && t.status === "completed")
            .reduce((sum, t) => sum + t.amount, 0),
        };
      });
    }

    // Calculate current period totals
    const currentTransactions = allTransactions.filter((t) => {
      const date = new Date(t.date);
      return (
        date >= currentStart && date <= currentEnd && t.status === "completed"
      );
    });

    const currentIncome = currentTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const currentExpense = currentTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate tips separately (case-insensitive check for "tiền tips")
    const currentTips = currentTransactions
      .filter(
        (t) =>
          t.type === "income" &&
          t.category?.name?.toLowerCase().trim().normalize("NFC") ===
            "tiền tips".normalize("NFC")
      )
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate previous period totals
    const previousTransactions = allTransactions.filter((t) => {
      const date = new Date(t.date);
      return (
        date >= previousStart && date <= previousEnd && t.status === "completed"
      );
    });

    const previousIncome = previousTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const previousExpense = previousTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const previousTips = previousTransactions
      .filter(
        (t) =>
          t.type === "income" &&
          t.category?.name?.toLowerCase().trim().normalize("NFC") ===
            "tiền tips".normalize("NFC")
      )
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate changes
    const incomeChange =
      previousIncome > 0
        ? ((currentIncome - previousIncome) / previousIncome) * 100
        : currentIncome > 0
        ? 100
        : 0;

    const expenseChange =
      previousExpense > 0
        ? ((currentExpense - previousExpense) / previousExpense) * 100
        : currentExpense > 0
        ? 100
        : 0;

    const tipsChange =
      previousTips > 0
        ? ((currentTips - previousTips) / previousTips) * 100
        : currentTips > 0
        ? 100
        : 0;

    // Category breakdown với TẤT CẢ danh mục
    const categoryMap = new Map<
      string,
      {
        name: string;
        income: number;
        expense: number;
        color: string;
        icon: string;
        count: number;
      }
    >();

    currentTransactions.forEach((t) => {
      if (t.category) {
        const existing = categoryMap.get(t.categoryId);
        if (existing) {
          if (t.type === "income") {
            existing.income += t.amount;
          } else {
            existing.expense += t.amount;
          }
          existing.count++;
        } else {
          categoryMap.set(t.categoryId, {
            name: t.category.name,
            income: t.type === "income" ? t.amount : 0,
            expense: t.type === "expense" ? t.amount : 0,
            color: t.category.color || "#6366f1",
            icon: t.category.icon || "📁",
            count: 1,
          });
        }
      }
    });

    // Thêm tất cả categories vào map (ngay cả khi có 0 giao dịch)
    allCategories.forEach((c: any) => {
      if (!categoryMap.has(c.id)) {
        categoryMap.set(c.id, {
          name: c.name,
          income: 0,
          expense: 0,
          color: c.color || "#6366f1",
          icon: c.icon || "📁",
          count: 0,
        });
      }
    });

    const categories = Array.from(categoryMap.values()).sort(
      (a, b) => b.income + b.expense - (a.income + a.expense)
    );

    // Separate income and expense categories (tất cả categories)
    const incomeCategories = categories
      .filter((c) => {
        const cat = allCategories.find((ac: any) => ac.name === c.name);
        return cat?.type === "income";
      })
      .sort((a, b) => b.income - a.income);

    const expenseCategories = categories
      .filter((c) => {
        const cat = allCategories.find((ac: any) => ac.name === c.name);
        return cat?.type === "expense";
      })
      .sort((a, b) => b.expense - a.expense);

    // Check if user has tips category
    const hasTipsCategory = incomeCategories.some(
      (c) =>
        c.name?.toLowerCase().trim().normalize("NFC") ===
        "tiền tips".normalize("NFC")
    );

    return {
      currentIncome,
      currentExpense,
      currentTips,
      previousIncome,
      previousExpense,
      previousTips,
      incomeChange,
      expenseChange,
      tipsChange,
      chartData,
      categories,
      incomeCategories,
      expenseCategories,
      hasTipsCategory,
      periodLabel:
        period === "week"
          ? `Tuần ${format(currentStart, "dd/MM", { locale: vi })} - ${format(
              currentEnd,
              "dd/MM/yyyy",
              { locale: vi }
            )}`
          : period === "month"
          ? format(currentStart, "MMMM yyyy", { locale: vi })
          : format(currentStart, "yyyy", { locale: vi }),
    };
  }, [
    allTransactions,
    allCategories,
    period,
    selectedWeek,
    selectedMonth,
    selectedYear,
  ]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  // Animated counters
  const animatedIncome = useCountAnimation(statistics.currentIncome, 800);
  const animatedExpense = useCountAnimation(statistics.currentExpense, 800);
  const animatedTips = useCountAnimation(statistics.currentTips, 800);

  const maxChartValue = Math.max(
    ...statistics.chartData.map((d) => Math.max(d.income, d.expense)),
    1
  );

  // Generate month/year/week options
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: format(new Date(2000, i, 1), "MMMM", { locale: vi }),
  }));
  const weeks = Array.from({ length: 4 }, (_, i) => ({
    value: i + 1,
    label: `Tuần ${i + 1}`,
  }));

  if (isLoading || categoriesLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Thống kê
              </h1>
              <p className="mt-2 text-sm sm:text-base text-gray-600">
                {statistics.periodLabel}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Week selector */}
              {period === "week" && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <select
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white text-gray-900"
                  >
                    {weeks.map((w) => (
                      <option key={w.value} value={w.value}>
                        {w.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white text-gray-900"
                  >
                    {months.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white text-gray-900"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Month/Year selector */}
              {period === "month" && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white text-gray-900"
                  >
                    {months.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white text-gray-900"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Year selector only */}
              {period === "year" && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white text-gray-900"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Period selector */}
              <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setPeriod("week")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    period === "week"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Tuần
                </button>
                <button
                  onClick={() => setPeriod("month")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    period === "month"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Tháng
                </button>
                <button
                  onClick={() => setPeriod("year")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    period === "year"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Năm
                </button>
              </div>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Income */}
            <div
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 card-hover animate-slideUp"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500 p-3 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Thu nhập
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(animatedIncome)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center text-sm">
                {statistics.incomeChange >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span
                  className={
                    statistics.incomeChange >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {formatPercentage(statistics.incomeChange)}
                </span>
                <span className="text-gray-500 ml-1">
                  so với{" "}
                  {period === "week"
                    ? "tuần"
                    : period === "month"
                    ? "tháng"
                    : "năm"}{" "}
                  trước
                </span>
              </div>
            </div>

            {/* Expense */}
            <div
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 card-hover animate-slideUp"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-red-500 p-3 rounded-lg">
                    <TrendingDown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Chi tiêu
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(animatedExpense)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center text-sm">
                {statistics.expenseChange >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-red-500 mr-1" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-green-500 mr-1" />
                )}
                <span
                  className={
                    statistics.expenseChange >= 0
                      ? "text-red-600"
                      : "text-green-600"
                  }
                >
                  {formatPercentage(statistics.expenseChange)}
                </span>
                <span className="text-gray-500 ml-1">
                  so với{" "}
                  {period === "week"
                    ? "tuần"
                    : period === "month"
                    ? "tháng"
                    : "năm"}{" "}
                  trước
                </span>
              </div>
            </div>

            {/* Tips - only show if user has tips category */}
            {statistics.hasTipsCategory && (
              <div
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 card-hover animate-slideUp"
                style={{ animationDelay: "0.3s" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-500 p-3 rounded-lg">
                      <span className="text-2xl">💰</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Tiền tips
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(animatedTips)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  {statistics.tipsChange >= 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span
                    className={
                      statistics.tipsChange >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {formatPercentage(statistics.tipsChange)}
                  </span>
                  <span className="text-gray-500 ml-1">
                    so với{" "}
                    {period === "week"
                      ? "tuần"
                      : period === "month"
                      ? "tháng"
                      : "năm"}{" "}
                    trước
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Chart */}
          <div
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-slideUp"
            style={{ animationDelay: "0.4s" }}
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Biểu đồ thu chi {period === "year" ? "theo tháng" : "theo ngày"}
            </h2>
            <div className="space-y-3 overflow-x-auto pb-2">
              <div className="min-w-max flex gap-2">
                {statistics.chartData.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center"
                    style={{
                      width:
                        period === "year"
                          ? "70px"
                          : period === "week"
                          ? "60px"
                          : "40px",
                    }}
                  >
                    <div className="flex flex-col items-center gap-1 mb-2 h-64 justify-end">
                      {/* Income bar */}
                      <div
                        className="w-full bg-green-500 rounded-t transition-all hover:bg-green-600 cursor-pointer animate-barGrow"
                        style={{
                          height: `${(item.income / maxChartValue) * 240}px`,
                          minHeight: item.income > 0 ? "4px" : "0px",
                          animationDelay: `${index * 0.03}s`,
                        }}
                        title={`Thu: ${formatCurrency(item.income)}`}
                      />
                      {/* Expense bar */}
                      <div
                        className="w-full bg-red-500 rounded-t transition-all hover:bg-red-600 cursor-pointer animate-barGrow"
                        style={{
                          height: `${(item.expense / maxChartValue) * 240}px`,
                          minHeight: item.expense > 0 ? "4px" : "0px",
                          animationDelay: `${index * 0.03 + 0.05}s`,
                        }}
                        title={`Chi: ${formatCurrency(item.expense)}`}
                      />
                    </div>
                    <span className="text-xs text-gray-600 mt-1">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded" />
                  <span className="text-sm text-gray-600">Thu nhập</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded" />
                  <span className="text-sm text-gray-600">Chi tiêu</span>
                </div>
              </div>
            </div>
          </div>

          {/* Category breakdown - Split into Income and Expense */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income Categories */}
            <div
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-slideUp"
              style={{ animationDelay: "0.5s" }}
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                Thu nhập theo danh mục
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {statistics.incomeCategories.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    Chưa có danh mục thu nhập nào
                  </p>
                ) : (
                  statistics.incomeCategories.map((category, index) => {
                    const percentage =
                      statistics.currentIncome > 0
                        ? (category.income / statistics.currentIncome) * 100
                        : 0;

                    return (
                      <div
                        key={index}
                        className="space-y-2 animate-fadeIn"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{category.icon}</span>
                            <span className="font-medium text-gray-700">
                              {category.name}
                            </span>
                            <span className="text-xs text-gray-400">
                              ({category.count} GD)
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">
                              {formatCurrency(category.income)}
                            </p>
                            {category.income > 0 && (
                              <p className="text-xs text-gray-500">
                                {percentage.toFixed(1)}%
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-2 rounded-full transition-all animate-progressFill"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: category.color,
                              animationDelay: `${index * 0.05 + 0.1}s`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Expense Categories */}
            <div
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-slideUp"
              style={{ animationDelay: "0.6s" }}
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <TrendingDown className="w-5 h-5 mr-2 text-red-600" />
                Chi tiêu theo danh mục
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {statistics.expenseCategories.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    Chưa có danh mục chi tiêu nào
                  </p>
                ) : (
                  statistics.expenseCategories.map((category, index) => {
                    const percentage =
                      statistics.currentExpense > 0
                        ? (category.expense / statistics.currentExpense) * 100
                        : 0;

                    return (
                      <div
                        key={index}
                        className="space-y-2 animate-fadeIn"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{category.icon}</span>
                            <span className="font-medium text-gray-700">
                              {category.name}
                            </span>
                            <span className="text-xs text-gray-400">
                              ({category.count} GD)
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-red-600">
                              {formatCurrency(category.expense)}
                            </p>
                            {category.expense > 0 && (
                              <p className="text-xs text-gray-500">
                                {percentage.toFixed(1)}%
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-2 rounded-full transition-all animate-progressFill"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: category.color,
                              animationDelay: `${index * 0.05 + 0.1}s`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
