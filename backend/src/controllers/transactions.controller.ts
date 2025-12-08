import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import {
  createTransactionSchema,
  updateTransactionSchema,
  getTransactionsQuerySchema,
} from "../validators/transaction.validator";
import {
  updateWalletBalance,
  validateSufficientBalance,
  reverseTransactionEffect,
} from "../utils/balance.helper";
import { z } from "zod";

/**
 * Create a new transaction
 */
export const createTransaction = async (req: Request, res: Response) => {
  try {
    const data = createTransactionSchema.parse(req.body);
    const userId = req.user!.userId;

    // Verify wallet ownership
    const wallet = await prisma.wallet.findUnique({
      where: { id: data.walletId },
    });

    if (!wallet || wallet.userId !== userId) {
      return res
        .status(404)
        .json({ error: "Wallet not found or unauthorized" });
    }

    // Verify category ownership and type match
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category || category.userId !== userId) {
      return res
        .status(404)
        .json({ error: "Category not found or unauthorized" });
    }

    if (category.type !== data.type) {
      return res.status(400).json({
        error: `Category type mismatch: category is for ${category.type} but transaction is ${data.type}`,
      });
    }

    // Check sufficient balance for completed expenses
    if (data.type === "expense" && data.status === "completed") {
      const hasSufficientBalance = await validateSufficientBalance(
        data.walletId,
        data.amount
      );
      if (!hasSufficientBalance) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
    }

    // Use Prisma transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          type: data.type,
          amount: data.amount,
          description: data.description,
          date: data.date ? new Date(data.date) : new Date(),
          status: data.status,
          workDate: data.workDate ? new Date(data.workDate) : null,
          receivedDate: data.receivedDate ? new Date(data.receivedDate) : null,
          user: {
            connect: { id: userId },
          },
          wallet: {
            connect: { id: data.walletId },
          },
          category: {
            connect: { id: data.categoryId },
          },
        },
        include: {
          wallet: true,
          category: true,
        },
      });

      // Update wallet balance only if status is completed
      if (data.status === "completed") {
        await updateWalletBalance(data.walletId, data.amount, data.type, "add");
      }

      return transaction;
    });

    res
      .status(201)
      .json({ message: "Transaction created successfully", data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Create transaction error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get transactions with filters
 */
export const getTransactions = async (req: Request, res: Response) => {
  try {
    const query = getTransactionsQuerySchema.parse(req.query);
    const userId = req.user!.userId;

    const whereClause: any = { userId };

    if (query.walletId) whereClause.walletId = query.walletId;
    if (query.categoryId) whereClause.categoryId = query.categoryId;
    if (query.type) whereClause.type = query.type;
    if (query.status) whereClause.status = query.status;

    if (query.startDate || query.endDate) {
      whereClause.date = {};
      if (query.startDate) whereClause.date.gte = new Date(query.startDate);
      if (query.endDate) whereClause.date.lte = new Date(query.endDate);
    }

    const skip = (query.page - 1) * query.limit;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        include: {
          wallet: true,
          category: true,
        },
        orderBy: { date: "desc" },
        skip,
        take: query.limit,
      }),
      prisma.transaction.count({ where: whereClause }),
    ]);

    res.json({
      data: transactions,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Get transactions error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get a single transaction by ID
 */
export const getTransactionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        wallet: true,
        category: true,
      },
    });

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    if (transaction.userId !== req.user!.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json({ data: transaction });
  } catch (error) {
    console.error("Get transaction error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Update a transaction
 */
export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateTransactionSchema.parse(req.body);
    const userId = req.user!.userId;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    if (transaction.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Verify new wallet/category if provided
    if (data.walletId) {
      const wallet = await prisma.wallet.findUnique({
        where: { id: data.walletId },
      });
      if (!wallet || wallet.userId !== userId) {
        return res
          .status(404)
          .json({ error: "Wallet not found or unauthorized" });
      }
    }

    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });
      if (!category || category.userId !== userId) {
        return res
          .status(404)
          .json({ error: "Category not found or unauthorized" });
      }
      if (category.type !== (data.type || transaction.type)) {
        return res.status(400).json({ error: "Category type mismatch" });
      }
    }

    // Use Prisma transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Reverse old transaction effect if it was completed
      if (transaction.status === "completed") {
        await reverseTransactionEffect(
          transaction.walletId,
          transaction.amount,
          transaction.type as "income" | "expense"
        );
      }

      // Update transaction
      const updatedTransaction = await tx.transaction.update({
        where: { id },
        data: {
          ...data,
          date: data.date ? new Date(data.date) : undefined,
        },
        include: {
          wallet: true,
          category: true,
        },
      });

      // Apply new transaction effect if status is completed
      const finalStatus = data.status || transaction.status;
      const finalWalletId = data.walletId || transaction.walletId;
      const finalAmount = data.amount || transaction.amount;
      const finalType = data.type || transaction.type;

      if (finalStatus === "completed") {
        // Check balance for expenses
        if (finalType === "expense") {
          const hasSufficientBalance = await validateSufficientBalance(
            finalWalletId,
            finalAmount
          );
          if (!hasSufficientBalance) {
            throw new Error("Insufficient balance");
          }
        }
        await updateWalletBalance(
          finalWalletId,
          finalAmount,
          finalType as "income" | "expense",
          "add"
        );
      }

      return updatedTransaction;
    });

    res.json({ message: "Transaction updated successfully", data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    if (error instanceof Error && error.message === "Insufficient balance") {
      return res.status(400).json({ error: "Insufficient balance" });
    }
    console.error("Update transaction error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Delete a transaction
 */
export const deleteTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    if (transaction.userId !== req.user!.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Use Prisma transaction for atomicity
    await prisma.$transaction(async (tx) => {
      // Check if this is a goal-related transaction
      const isGoalSaving =
        transaction.category?.name === "Tiết kiệm" &&
        transaction.description?.includes("Tiết kiệm cho mục tiêu:");
      const isGoalRefund =
        transaction.category?.name === "Hoàn tiền mục tiêu" &&
        transaction.description?.includes("Hoàn tiền từ mục tiêu đã xóa:");

      if (isGoalSaving || isGoalRefund) {
        // Extract goal name from description
        const goalNameMatch = transaction.description?.match(/: (.+)$/);
        if (goalNameMatch) {
          const goalName = goalNameMatch[1];

          // Find and delete paired transactions
          if (isGoalSaving) {
            // Delete corresponding refund transactions
            const refundTransactions = await tx.transaction.findMany({
              where: {
                userId: transaction.userId,
                description: {
                  contains: `Hoàn tiền từ mục tiêu đã xóa: ${goalName}`,
                },
              },
            });

            for (const refund of refundTransactions) {
              if (refund.status === "completed") {
                await reverseTransactionEffect(
                  refund.walletId,
                  refund.amount,
                  refund.type as "income" | "expense"
                );
              }
              await tx.transaction.delete({ where: { id: refund.id } });
            }
          } else if (isGoalRefund) {
            // Delete corresponding saving transactions
            const savingTransactions = await tx.transaction.findMany({
              where: {
                userId: transaction.userId,
                description: {
                  contains: `Tiết kiệm cho mục tiêu: ${goalName}`,
                },
              },
            });

            for (const saving of savingTransactions) {
              if (saving.status === "completed") {
                await reverseTransactionEffect(
                  saving.walletId,
                  saving.amount,
                  saving.type as "income" | "expense"
                );
              }
              await tx.transaction.delete({ where: { id: saving.id } });
            }
          }
        }
      }

      // Reverse balance effect if completed
      if (transaction.status === "completed") {
        await reverseTransactionEffect(
          transaction.walletId,
          transaction.amount,
          transaction.type as "income" | "expense"
        );
      }

      // Delete the original transaction
      await tx.transaction.delete({ where: { id } });
    });

    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Delete transaction error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Mark tip as received (change status from pending to completed)
 */
export const markTipAsReceived = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    if (transaction.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (transaction.type !== "income") {
      return res
        .status(400)
        .json({ error: "Only income transactions can be marked as received" });
    }

    if (transaction.status === "completed") {
      return res
        .status(400)
        .json({ error: "Transaction is already completed" });
    }

    // Use Prisma transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Update transaction status
      const updatedTransaction = await tx.transaction.update({
        where: { id },
        data: {
          status: "completed",
          receivedDate: new Date(),
        },
        include: {
          wallet: true,
          category: true,
        },
      });

      // Update wallet balance
      await updateWalletBalance(
        transaction.walletId,
        transaction.amount,
        transaction.type as "income" | "expense",
        "add"
      );

      return updatedTransaction;
    });

    res.json({
      message: "Transaction marked as received successfully",
      data: result,
    });
  } catch (error) {
    console.error("Mark tip as received error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
