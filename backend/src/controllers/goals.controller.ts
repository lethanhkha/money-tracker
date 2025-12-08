import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import {
  createGoalSchema,
  updateGoalSchema,
  addContributionSchema,
  getGoalsQuerySchema,
} from "../validators/goal.validator";
import {
  updateWalletBalance,
  validateSufficientBalance,
} from "../utils/balance.helper";
import { z } from "zod";

/**
 * Create a new goal
 */
export const createGoal = async (req: Request, res: Response) => {
  try {
    const data = createGoalSchema.parse(req.body);
    const userId = req.user!.userId;

    // Validate currentAmount <= targetAmount
    if (data.currentAmount > data.targetAmount) {
      return res
        .status(400)
        .json({ error: "Current amount cannot exceed target amount" });
    }

    const goal = await prisma.goal.create({
      data: {
        name: data.name,
        targetAmount: data.targetAmount,
        currentAmount: data.currentAmount,
        description: data.description,
        deadline: data.deadline ? new Date(data.deadline) : null,
        status: data.status,
        user: {
          connect: { id: userId },
        },
      },
    });

    res.status(201).json({ message: "Goal created successfully", data: goal });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Create goal error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get all goals with filters
 */
export const getGoals = async (req: Request, res: Response) => {
  try {
    const query = getGoalsQuerySchema.parse(req.query);
    const userId = req.user!.userId;

    const whereClause: any = { userId };

    if (query.status) whereClause.status = query.status;

    const skip = (query.page - 1) * query.limit;

    const [goals, total] = await Promise.all([
      prisma.goal.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: query.limit,
      }),
      prisma.goal.count({ where: whereClause }),
    ]);

    res.json({
      data: goals,
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
    console.error("Get goals error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get a single goal by ID
 */
export const getGoalById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const goal = await prisma.goal.findUnique({
      where: { id },
      include: {
        contributions: {
          orderBy: { contributionDate: "desc" },
        },
      },
    });

    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    if (goal.userId !== req.user!.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json({ data: goal });
  } catch (error) {
    console.error("Get goal error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Update a goal
 */
export const updateGoal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateGoalSchema.parse(req.body);

    const goal = await prisma.goal.findUnique({
      where: { id },
    });

    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    if (goal.userId !== req.user!.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Validate targetAmount if updated
    if (data.targetAmount && data.targetAmount < goal.currentAmount) {
      return res
        .status(400)
        .json({ error: "Target amount cannot be less than current amount" });
    }

    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: {
        ...data,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
      },
    });

    res.json({ message: "Goal updated successfully", data: updatedGoal });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Update goal error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Delete a goal
 */
export const deleteGoal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const goal = await prisma.goal.findUnique({
      where: { id },
    });

    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    if (goal.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // If goal has contributions, refund to wallets
      if (goal.currentAmount > 0) {
        // Find all contribution transactions for this goal
        const contributions = await tx.transaction.findMany({
          where: {
            userId,
            type: "expense",
            description: {
              contains: `Tiết kiệm cho mục tiêu: ${goal.name}`,
            },
          },
          include: {
            wallet: true,
          },
        });

        if (contributions.length > 0) {
          // Find or create refund category
          let refundCategory = await tx.category.findFirst({
            where: {
              userId,
              name: "Hoàn tiền mục tiêu",
              type: "income",
            },
          });

          if (!refundCategory) {
            refundCategory = await tx.category.create({
              data: {
                name: "Hoàn tiền mục tiêu",
                type: "income",
                icon: "💰",
                color: "#10B981",
                user: {
                  connect: { id: userId },
                },
              },
            });
          }

          // Group contributions by wallet
          const walletContributions = new Map<string, number>();
          for (const transaction of contributions) {
            if (transaction.wallet) {
              const currentAmount =
                walletContributions.get(transaction.walletId) || 0;
              walletContributions.set(
                transaction.walletId,
                currentAmount + transaction.amount
              );
            }
          }

          // Create refund transactions and update wallet balances
          for (const [walletId, amount] of walletContributions) {
            // Create refund transaction
            await tx.transaction.create({
              data: {
                type: "income",
                amount,
                description: `Hoàn tiền từ mục tiêu đã xóa: ${goal.name}`,
                date: new Date(),
                status: "completed",
                user: {
                  connect: { id: userId },
                },
                wallet: {
                  connect: { id: walletId },
                },
                category: {
                  connect: { id: refundCategory.id },
                },
              },
            });

            // Update wallet balance
            await tx.wallet.update({
              where: { id: walletId },
              data: {
                balance: {
                  increment: amount,
                },
              },
            });
          }

          // Keep original contribution transactions for history
          // They remain as "Tiết kiệm" expenses, balanced by "Hoàn tiền" income
        }
      }

      // Delete the goal
      await tx.goal.delete({ where: { id } });
    });

    res.json({ message: "Goal deleted successfully and funds refunded" });
  } catch (error) {
    console.error("Delete goal error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Add contribution to a goal
 */
export const addContribution = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = addContributionSchema.parse(req.body);
    const userId = req.user!.userId;

    const goal = await prisma.goal.findUnique({
      where: { id },
    });

    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    if (goal.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (goal.status !== "in_progress") {
      return res
        .status(400)
        .json({ error: "Can only contribute to in-progress goals" });
    }

    const walletId = data.walletId;

    // Verify wallet ownership
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
    });
    if (!wallet || wallet.userId !== userId) {
      return res
        .status(404)
        .json({ error: "Wallet not found or unauthorized" });
    }

    // Check sufficient balance (contribution is an expense)
    const hasSufficientBalance = await validateSufficientBalance(
      walletId,
      data.contributionAmount
    );
    if (!hasSufficientBalance) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Calculate new current amount
    const newCurrentAmount = goal.currentAmount + data.contributionAmount;

    if (newCurrentAmount > goal.targetAmount) {
      return res
        .status(400)
        .json({ error: "Contribution would exceed target amount" });
    }

    // Use Prisma transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      const newStatus =
        newCurrentAmount === goal.targetAmount ? "completed" : "in_progress";

      // Update goal
      const updatedGoal = await tx.goal.update({
        where: { id },
        data: {
          currentAmount: newCurrentAmount,
          status: newStatus,
        },
      });

      // Find or create a default category for goal contributions
      let category = await tx.category.findFirst({
        where: {
          userId,
          name: "Tiết kiệm",
          type: "expense",
        },
      });

      if (!category) {
        category = await tx.category.create({
          data: {
            name: "Tiết kiệm",
            type: "expense",
            icon: "🎯",
            color: "#FCA5A5",
            user: {
              connect: { id: userId },
            },
          },
        });
      }

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          type: "expense",
          amount: data.contributionAmount,
          description: data.note || `Tiết kiệm cho mục tiêu: ${goal.name}`,
          date: data.contributionDate
            ? new Date(data.contributionDate)
            : new Date(),
          status: "completed",
          user: {
            connect: { id: userId },
          },
          wallet: {
            connect: { id: walletId },
          },
          category: {
            connect: { id: category.id },
          },
        },
      });

      // Create contribution record
      await tx.goalContribution.create({
        data: {
          goalId: id,
          walletId,
          amount: data.contributionAmount,
          contributionDate: data.contributionDate
            ? new Date(data.contributionDate)
            : new Date(),
          note: data.note,
          transactionId: transaction.id,
        },
      });

      // Update wallet balance (add expense transaction effect)
      await updateWalletBalance(
        walletId,
        data.contributionAmount,
        "expense",
        "add"
      );

      return updatedGoal;
    });

    res.json({ message: "Contribution added successfully", data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Add contribution error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get all contributions for a goal
 */
export const getGoalContributions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const goal = await prisma.goal.findUnique({
      where: { id },
    });

    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    if (goal.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const contributions = await prisma.goalContribution.findMany({
      where: { goalId: id },
      orderBy: { contributionDate: "desc" },
    });

    res.json({ data: contributions });
  } catch (error) {
    console.error("Get contributions error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Delete a contribution and refund to wallet
 */
export const deleteGoalContribution = async (
  req: Request,
  res: Response
) => {
  try {
    const { id, contributionId } = req.params;
    const userId = req.user!.userId;

    const contribution = await prisma.goalContribution.findUnique({
      where: { id: contributionId },
      include: { goal: true },
    });

    if (!contribution) {
      return res.status(404).json({ error: "Contribution not found" });
    }

    if (contribution.goal.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (contribution.goal.id !== id) {
      return res
        .status(400)
        .json({ error: "Contribution does not belong to this goal" });
    }

    const newCurrentAmount =
      contribution.goal.currentAmount - contribution.amount;
    const newStatus =
      newCurrentAmount === 0
        ? "in_progress"
        : newCurrentAmount >= contribution.goal.targetAmount
        ? "completed"
        : contribution.goal.status;

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Find or create refund category
      let refundCategory = await tx.category.findFirst({
        where: {
          userId,
          name: "Hoàn tiền mục tiêu",
          type: "income",
        },
      });

      if (!refundCategory) {
        refundCategory = await tx.category.create({
          data: {
            name: "Hoàn tiền mục tiêu",
            type: "income",
            icon: "💰",
            color: "#FCA5A5",
            user: {
              connect: { id: userId },
            },
          },
        });
      }

      // Create refund transaction
      await tx.transaction.create({
        data: {
          type: "income",
          amount: contribution.amount,
          description: `Hoàn tiền góp mục tiêu: ${contribution.goal.name}`,
          date: new Date(),
          status: "completed",
          user: {
            connect: { id: userId },
          },
          wallet: {
            connect: { id: contribution.walletId },
          },
          category: {
            connect: { id: refundCategory.id },
          },
        },
      });

      // Update wallet balance (refund = income)
      await tx.wallet.update({
        where: { id: contribution.walletId },
        data: {
          balance: {
            increment: contribution.amount,
          },
        },
      });

      // Delete the original transaction if exists
      if (contribution.transactionId) {
        await tx.transaction.delete({
          where: { id: contribution.transactionId },
        });
      }

      // Delete contribution record
      await tx.goalContribution.delete({
        where: { id: contributionId },
      });

      // Update goal
      const updatedGoal = await tx.goal.update({
        where: { id },
        data: {
          currentAmount: newCurrentAmount,
          status: newStatus,
        },
        include: {
          contributions: {
            orderBy: { contributionDate: "desc" },
          },
        },
      });

      return updatedGoal;
    });

    res.json({
      message: "Contribution deleted and refunded successfully",
      data: result,
    });
  } catch (error) {
    console.error("Delete contribution error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
