import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

/**
 * Get financial summary
 * Returns total income, total expense, balance, pending tips
 */
export const getFinancialSummary = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Get all completed transactions
    const completedTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        status: "completed",
      },
      select: {
        type: true,
        amount: true,
      },
    });

    // Get all pending transactions (tips)
    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        status: "pending",
      },
      select: {
        amount: true,
      },
    });

    // Calculate totals
    let totalIncome = 0;
    let totalExpense = 0;

    completedTransactions.forEach((transaction) => {
      if (transaction.type === "income") {
        totalIncome += transaction.amount;
      } else {
        totalExpense += transaction.amount;
      }
    });

    const balance = totalIncome - totalExpense;

    const pendingTips = pendingTransactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );

    // Get wallet balances
    const wallets = await prisma.wallet.findMany({
      where: { userId },
      select: {
        balance: true,
      },
    });

    const totalWalletBalance = wallets.reduce(
      (sum, wallet) => sum + wallet.balance,
      0
    );

    // Get debt summary
    const debts = await prisma.debt.findMany({
      where: { userId, status: "active" },
      select: {
        type: true,
        remainingAmount: true,
      },
    });

    let totalLending = 0;
    let totalBorrowing = 0;

    debts.forEach((debt) => {
      if (debt.type === "lending") {
        totalLending += debt.remainingAmount;
      } else {
        totalBorrowing += debt.remainingAmount;
      }
    });

    // Get goal summary
    const goals = await prisma.goal.findMany({
      where: { userId, status: "in_progress" },
      select: {
        targetAmount: true,
        currentAmount: true,
      },
    });

    const totalGoalTarget = goals.reduce(
      (sum, goal) => sum + goal.targetAmount,
      0
    );
    const totalGoalSaved = goals.reduce(
      (sum, goal) => sum + goal.currentAmount,
      0
    );

    res.json({
      data: {
        totalIncome,
        totalExpense,
        balance,
        pendingTips,
        totalWalletBalance,
        debts: {
          totalLending,
          totalBorrowing,
          netDebt: totalBorrowing - totalLending,
        },
        goals: {
          totalTarget: totalGoalTarget,
          totalSaved: totalGoalSaved,
          remaining: totalGoalTarget - totalGoalSaved,
        },
      },
    });
  } catch (error) {
    console.error("Get financial summary error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get financial trends
 * Returns monthly income/expense data for the last 6 months
 */
export const getTrends = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const monthsBack = parseInt(req.query.months as string) || 6;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsBack);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        status: "completed",
        date: {
          gte: startDate,
        },
      },
      select: {
        type: true,
        amount: true,
        date: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    // Group by month
    const monthlyData: Record<string, { income: number; expense: number }> = {};

    transactions.forEach((transaction) => {
      const monthKey = transaction.date.toISOString().substring(0, 7); // YYYY-MM

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0 };
      }

      if (transaction.type === "income") {
        monthlyData[monthKey].income += transaction.amount;
      } else {
        monthlyData[monthKey].expense += transaction.amount;
      }
    });

    // Convert to array and sort
    const trends = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        income: data.income,
        expense: data.expense,
        balance: data.income - data.expense,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    res.json({ data: trends });
  } catch (error) {
    console.error("Get trends error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get category breakdown
 * Returns spending/income by category
 */
export const getCategoryBreakdown = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const type = req.query.type as "income" | "expense" | undefined;
    const period = req.query.period as string; // YYYY-MM format

    const whereClause: any = {
      userId,
      status: "completed",
    };

    if (type) {
      whereClause.type = type;
    }

    if (period) {
      const [year, month] = period.split("-");
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

      whereClause.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        category: true,
      },
    });

    // Group by category
    const categoryData: Record<
      string,
      {
        categoryId: string;
        categoryName: string;
        categoryIcon: string;
        categoryColor: string;
        type: string;
        total: number;
        count: number;
      }
    > = {};

    transactions.forEach((transaction) => {
      const key = transaction.categoryId;

      if (!categoryData[key]) {
        categoryData[key] = {
          categoryId: transaction.category.id,
          categoryName: transaction.category.name,
          categoryIcon: transaction.category.icon,
          categoryColor: transaction.category.color,
          type: transaction.category.type,
          total: 0,
          count: 0,
        };
      }

      categoryData[key].total += transaction.amount;
      categoryData[key].count++;
    });

    // Convert to array and sort by total
    const breakdown = Object.values(categoryData).sort(
      (a, b) => b.total - a.total
    );

    const totalAmount = breakdown.reduce((sum, item) => sum + item.total, 0);

    res.json({
      data: {
        breakdown,
        totalAmount,
      },
    });
  } catch (error) {
    console.error("Get category breakdown error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get recent transactions
 * Returns the most recent transactions
 */
export const getRecentTransactions = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 10;

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: {
        wallet: true,
        category: true,
      },
      orderBy: {
        date: "desc",
      },
      take: limit,
    });

    res.json({ data: transactions });
  } catch (error) {
    console.error("Get recent transactions error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
