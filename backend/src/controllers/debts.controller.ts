import { Response } from "express";
import { AuthRequest } from "../types";
import { prisma } from "../lib/prisma";
import {
  createDebtSchema,
  updateDebtSchema,
  makePaymentSchema,
  getDebtsQuerySchema,
} from "../validators/debt.validator";
import {
  updateWalletBalance,
  validateSufficientBalance,
} from "../utils/balance.helper";
import { z } from "zod";

/**
 * Create a new debt
 */
export const createDebt = async (req: AuthRequest, res: Response) => {
  try {
    const data = createDebtSchema.parse(req.body);
    const userId = req.user!.userId;

    const debt = await prisma.debt.create({
      data: {
        type: data.type,
        personName: data.personName,
        amount: data.amount,
        remainingAmount: data.amount, // Initially, remaining = total
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: "pending", // New debts start as pending
        user: {
          connect: { id: userId },
        },
      },
    });

    res.status(201).json({ message: "Debt created successfully", data: debt });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Create debt error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get all debts with filters
 */
export const getDebts = async (req: AuthRequest, res: Response) => {
  try {
    const query = getDebtsQuerySchema.parse(req.query);
    const userId = req.user!.userId;

    const whereClause: any = { userId };

    if (query.type) whereClause.type = query.type;
    if (query.status) whereClause.status = query.status;

    const skip = (query.page - 1) * query.limit;

    const [debts, total] = await Promise.all([
      prisma.debt.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: query.limit,
      }),
      prisma.debt.count({ where: whereClause }),
    ]);

    res.json({
      data: debts,
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
    console.error("Get debts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get a single debt by ID
 */
export const getDebtById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const debt = await prisma.debt.findUnique({
      where: { id },
      include: {
        payments: {
          orderBy: { paymentDate: "desc" },
        },
      },
    });

    if (!debt) {
      return res.status(404).json({ error: "Debt not found" });
    }

    if (debt.userId !== req.user!.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json({ data: debt });
  } catch (error) {
    console.error("Get debt error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Update a debt
 */
export const updateDebt = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateDebtSchema.parse(req.body);

    const debt = await prisma.debt.findUnique({
      where: { id },
    });

    if (!debt) {
      return res.status(404).json({ error: "Debt not found" });
    }

    if (debt.userId !== req.user!.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const updatedDebt = await prisma.debt.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    });

    res.json({ message: "Debt updated successfully", data: updatedDebt });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Update debt error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Delete a debt
 */
export const deleteDebt = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const debt = await prisma.debt.findUnique({
      where: { id },
    });

    if (!debt) {
      return res.status(404).json({ error: "Debt not found" });
    }

    if (debt.userId !== req.user!.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await prisma.debt.delete({ where: { id } });

    res.json({ message: "Debt deleted successfully" });
  } catch (error) {
    console.error("Delete debt error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Make a partial payment on a debt
 */
export const makePartialPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = makePaymentSchema.parse(req.body);
    const userId = req.user!.userId;

    const debt = await prisma.debt.findUnique({
      where: { id },
    });

    if (!debt) {
      return res.status(404).json({ error: "Debt not found" });
    }

    if (debt.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (debt.status === "completed") {
      return res.status(400).json({ error: "Debt is already fully paid" });
    }

    if (data.amount > debt.remainingAmount) {
      return res
        .status(400)
        .json({ error: "Payment amount exceeds remaining debt" });
    }

    const newRemainingAmount = debt.remainingAmount - data.amount;
    const newStatus =
      newRemainingAmount === 0
        ? "completed"
        : newRemainingAmount < debt.amount
        ? "partial"
        : "pending";

    // Create payment record and update debt in a transaction
    const [payment, updatedDebt] = await prisma.$transaction([
      prisma.debtPayment.create({
        data: {
          debtId: id,
          amount: data.amount,
          paymentDate: data.paymentDate
            ? new Date(data.paymentDate)
            : new Date(),
          note: data.note,
        },
      }),
      prisma.debt.update({
        where: { id },
        data: {
          remainingAmount: newRemainingAmount,
          status: newStatus,
        },
        include: {
          payments: {
            orderBy: { paymentDate: "desc" },
          },
        },
      }),
    ]);

    res.json({
      message: "Payment recorded successfully",
      data: updatedDebt,
      payment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");
      return res.status(400).json({ error: errorMessage });
    }
    console.error("Make payment error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get all payments for a specific debt
 */
export const getDebtPayments = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const debt = await prisma.debt.findUnique({
      where: { id },
    });

    if (!debt) {
      return res.status(404).json({ error: "Debt not found" });
    }

    if (debt.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const payments = await prisma.debtPayment.findMany({
      where: { debtId: id },
      orderBy: { paymentDate: "desc" },
    });

    res.json({ data: payments });
  } catch (error) {
    console.error("Get debt payments error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Delete a payment and update debt accordingly
 */
export const deleteDebtPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { id, paymentId } = req.params;
    const userId = req.user!.userId;

    const payment = await prisma.debtPayment.findUnique({
      where: { id: paymentId },
      include: { debt: true },
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    if (payment.debt.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (payment.debt.id !== id) {
      return res
        .status(400)
        .json({ error: "Payment does not belong to this debt" });
    }

    const newRemainingAmount = payment.debt.remainingAmount + payment.amount;
    const newStatus =
      newRemainingAmount >= payment.debt.amount ? "pending" : "partial";

    // Delete payment and update debt in a transaction
    const [, updatedDebt] = await prisma.$transaction([
      prisma.debtPayment.delete({
        where: { id: paymentId },
      }),
      prisma.debt.update({
        where: { id },
        data: {
          remainingAmount: newRemainingAmount,
          status: newStatus,
        },
        include: {
          payments: {
            orderBy: { paymentDate: "desc" },
          },
        },
      }),
    ]);

    res.json({
      message: "Payment deleted successfully",
      data: updatedDebt,
    });
  } catch (error) {
    console.error("Delete payment error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
