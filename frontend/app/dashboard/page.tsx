"use client";

import { useMemo } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { walletsApi } from "@/lib/api/wallets";
import { transactionsApi } from "@/lib/api/transactions";
import { goalsApi } from "@/lib/api/goals";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";
import { useCountAnimation } from "@/hooks/useCountAnimation";

export default function DashboardPage() {
  // Fetch data
  const { data: wallets = [], isLoading: walletsLoading } = useQuery({
    queryKey: ["wallets"],
    queryFn: () => walletsApi.getAll(),
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => transactionsApi.getAll(),
  });

  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: () => goalsApi.getAll(),
  });

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Total balance
    const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

    // Current month income/expense
    const currentMonthIncome = transactions
      .filter((t) => {
        const date = new Date(t.date);
        return (
          t.type === "income" &&
          date.getMonth() === currentMonth &&
          date.getFullYear() === currentYear &&
          t.status === "completed"
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const currentMonthExpense = transactions
      .filter((t) => {
        const date = new Date(t.date);
        return (
          t.type === "expense" &&
          date.getMonth() === currentMonth &&
          date.getFullYear() === currentYear &&
          t.status === "completed"
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);

    // Last month income/expense
    const lastMonthIncome = transactions
      .filter((t) => {
        const date = new Date(t.date);
        return (
          t.type === "income" &&
          date.getMonth() === lastMonth &&
          date.getFullYear() === lastMonthYear &&
          t.status === "completed"
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const lastMonthExpense = transactions
      .filter((t) => {
        const date = new Date(t.date);
        return (
          t.type === "expense" &&
          date.getMonth() === lastMonth &&
          date.getFullYear() === lastMonthYear &&
          t.status === "completed"
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate percentage changes
    const incomeChange =
      lastMonthIncome > 0
        ? ((currentMonthIncome - lastMonthIncome) / lastMonthIncome) * 100
        : currentMonthIncome > 0
        ? 100
        : 0;

    const expenseChange =
      lastMonthExpense > 0
        ? ((currentMonthExpense - lastMonthExpense) / lastMonthExpense) * 100
        : currentMonthExpense > 0
        ? 100
        : 0;

    // Goals stats
    const completedGoals = goals.filter(
      (g: any) => g.status === "completed"
    ).length;
    const totalGoals = goals.length;

    return {
      totalBalance,
      currentMonthIncome,
      currentMonthExpense,
      incomeChange,
      expenseChange,
      completedGoals,
      totalGoals,
    };
  }, [wallets, transactions, goals]);

  // Calculate category spending
  const categorySpending = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const expenseTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      return (
        t.type === "expense" &&
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear &&
        t.status === "completed"
      );
    });

    const categoryMap = new Map<
      string,
      { name: string; amount: number; color: string; icon: string }
    >();

    expenseTransactions.forEach((t) => {
      if (t.category) {
        const existing = categoryMap.get(t.categoryId);
        if (existing) {
          existing.amount += t.amount;
        } else {
          categoryMap.set(t.categoryId, {
            name: t.category.name,
            amount: t.amount,
            color: t.category.color || "#6366f1",
            icon: t.category.icon || "📁",
          });
        }
      }
    });

    return Array.from(categoryMap.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5); // Top 5 categories
  }, [transactions]);

  const totalCategorySpending = categorySpending.reduce(
    (sum, cat) => sum + cat.amount,
    0
  );

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

  // Recent transactions (last 10)
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [transactions]);

  const isLoading = walletsLoading || transactionsLoading || goalsLoading;

  // Animated counters
  const animatedBalance = useCountAnimation(stats.totalBalance, 800);
  const animatedIncome = useCountAnimation(stats.currentMonthIncome, 800);
  const animatedExpense = useCountAnimation(stats.currentMonthExpense, 800);

  if (isLoading) {
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
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Dashboard
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600">
              Tổng quan tài chính của bạn
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Balance */}
            <div
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 card-hover animate-slideUp"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Tổng số dư
                  </p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {formatCurrency(animatedBalance)}
                  </p>
                </div>
                <div className="bg-blue-500 p-3 rounded-lg transform hover:rotate-12 transition-transform duration-300">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Income */}
            <div
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 card-hover animate-slideUp"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Thu nhập tháng này
                  </p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {formatCurrency(animatedIncome)}
                  </p>
                  <div className="mt-2 flex items-center text-sm">
                    {stats.incomeChange >= 0 ? (
                      <ArrowUpRight className="w-4 h-4 text-green-500 mr-1 animate-bounce" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span
                      className={
                        stats.incomeChange >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {formatPercentage(stats.incomeChange)}
                    </span>
                    <span className="text-gray-500 ml-1">
                      so với tháng trước
                    </span>
                  </div>
                </div>
                <div className="bg-green-500 p-3 rounded-lg transform hover:rotate-12 transition-transform duration-300">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Expense */}
            <div
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 card-hover animate-slideUp"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Chi tiêu tháng này
                  </p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {formatCurrency(animatedExpense)}
                  </p>
                  <div className="mt-2 flex items-center text-sm">
                    {stats.expenseChange >= 0 ? (
                      <ArrowUpRight className="w-4 h-4 text-red-500 mr-1" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-green-500 mr-1 animate-bounce" />
                    )}
                    <span
                      className={
                        stats.expenseChange >= 0
                          ? "text-red-600"
                          : "text-green-600"
                      }
                    >
                      {formatPercentage(stats.expenseChange)}
                    </span>
                    <span className="text-gray-500 ml-1">
                      so với tháng trước
                    </span>
                  </div>
                </div>
                <div className="bg-red-500 p-3 rounded-lg transform hover:rotate-12 transition-transform duration-300">
                  <TrendingDown className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Goals */}
            <div
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 card-hover animate-slideUp"
              style={{ animationDelay: "0.4s" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Mục tiêu hoàn thành
                  </p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {stats.completedGoals}/{stats.totalGoals}
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    {stats.totalGoals > 0
                      ? `${(
                          (stats.completedGoals / stats.totalGoals) *
                          100
                        ).toFixed(0)}%`
                      : "0%"}
                  </p>
                </div>
                <div className="bg-purple-500 p-3 rounded-lg transform hover:rotate-12 transition-transform duration-300">
                  <Target className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Income/Expense Chart */}
            <div
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 card-hover animate-slideUp"
              style={{ animationDelay: "0.5s" }}
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Thu chi tháng này
              </h2>
              <div className="space-y-4">
                {/* Income Bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Thu nhập
                    </span>
                    <span className="text-sm font-semibold text-green-600">
                      {formatCurrency(stats.currentMonthIncome)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-green-500 h-4 rounded-full transition-all origin-left"
                      style={{
                        width: `${
                          Math.max(
                            stats.currentMonthIncome,
                            stats.currentMonthExpense
                          ) > 0
                            ? (stats.currentMonthIncome /
                                Math.max(
                                  stats.currentMonthIncome,
                                  stats.currentMonthExpense
                                )) *
                              100
                            : 0
                        }%`,
                        animation: "slideInFromLeft 1s ease-out 0.5s backwards",
                      }}
                    />
                  </div>
                </div>

                {/* Expense Bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Chi tiêu
                    </span>
                    <span className="text-sm font-semibold text-red-600">
                      {formatCurrency(stats.currentMonthExpense)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-red-500 h-4 rounded-full transition-all origin-left"
                      style={{
                        width: `${
                          Math.max(
                            stats.currentMonthIncome,
                            stats.currentMonthExpense
                          ) > 0
                            ? (stats.currentMonthExpense /
                                Math.max(
                                  stats.currentMonthIncome,
                                  stats.currentMonthExpense
                                )) *
                              100
                            : 0
                        }%`,
                        animation: "slideInFromLeft 1s ease-out 0.6s backwards",
                      }}
                    />
                  </div>
                </div>

                {/* Net */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">
                      Còn lại
                    </span>
                    <span
                      className={`text-lg font-bold ${
                        stats.currentMonthIncome - stats.currentMonthExpense >=
                        0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatCurrency(
                        stats.currentMonthIncome - stats.currentMonthExpense
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Spending Chart */}
            <div
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 card-hover animate-slideUp"
              style={{ animationDelay: "0.6s" }}
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Chi tiêu theo danh mục
              </h2>
              {categorySpending.length === 0 ? (
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Chưa có dữ liệu chi tiêu</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {categorySpending.map((cat, index) => (
                    <div
                      key={index}
                      className="animate-slideUp"
                      style={{ animationDelay: `${0.7 + index * 0.1}s` }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg transform hover:scale-125 transition-transform duration-200">
                            {cat.icon}
                          </span>
                          <span className="text-sm font-medium text-gray-700">
                            {cat.name}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(cat.amount)}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            {totalCategorySpending > 0
                              ? `${(
                                  (cat.amount / totalCategorySpending) *
                                  100
                                ).toFixed(1)}%`
                              : "0%"}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full transition-all duration-1000 ease-out"
                          style={{
                            backgroundColor: cat.color,
                            width: `${
                              totalCategorySpending > 0
                                ? (cat.amount / totalCategorySpending) * 100
                                : 0
                            }%`,
                            animation: "slideInFromLeft 0.8s ease-out forwards",
                            animationDelay: `${0.7 + index * 0.1}s`,
                            transform: "scaleX(0)",
                            transformOrigin: "left",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent transactions */}
          <div
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 card-hover animate-slideUp"
            style={{ animationDelay: "0.7s" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Giao dịch gần đây
              </h2>
              <Link
                href="/transactions"
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors duration-200"
              >
                Xem tất cả
              </Link>
            </div>
            {recentTransactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Chưa có giao dịch nào</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((transaction, index) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-[1.02] animate-slideUp"
                    style={{ animationDelay: `${0.8 + index * 0.05}s` }}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.type === "income"
                            ? "bg-green-100"
                            : "bg-red-100"
                        }`}
                      >
                        <span className="text-lg">
                          {transaction.category?.icon || "💰"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          {transaction.name && (
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {transaction.name}
                            </p>
                          )}
                          {transaction.name && transaction.category && (
                            <span className="w-2 h-2 bg-gray-300 rounded-full" />
                          )}
                          {transaction.category && (
                            <p className="text-sm text-gray-600 truncate">
                              {transaction.category.name}
                            </p>
                          )}
                        </div>
                        {transaction.description && (
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {transaction.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {format(
                            new Date(transaction.date),
                            "dd/MM/yyyy HH:mm",
                            { locale: vi }
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p
                        className={`text-sm font-semibold ${
                          transaction.type === "income"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </p>
                      {transaction.status === "pending" && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                          Chưa nhận
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
