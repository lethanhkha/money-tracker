import { z } from "zod";

export const createGoalSchema = z.object({
  name: z.string().min(2, "Goal name must be at least 2 characters"),
  targetAmount: z.number().positive("Target amount must be positive"),
  currentAmount: z
    .number()
    .min(0, "Current amount cannot be negative")
    .default(0),
  description: z.string().optional(),
  deadline: z.string().optional(),
  status: z
    .enum(["in_progress", "completed", "cancelled"])
    .default("in_progress"),
});

export const updateGoalSchema = z.object({
  name: z.string().min(2).optional(),
  targetAmount: z.number().positive().optional(),
  description: z.string().optional(),
  deadline: z.string().optional(),
  status: z.enum(["in_progress", "completed", "cancelled"]).optional(),
});

export const addContributionSchema = z.object({
  contributionAmount: z
    .number()
    .positive("Contribution amount must be positive"),
  walletId: z.string().uuid(),
  contributionDate: z.string().optional(),
  note: z.string().optional(),
});

export const getGoalsQuerySchema = z.object({
  status: z.enum(["in_progress", "completed", "cancelled"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type AddContributionInput = z.infer<typeof addContributionSchema>;
export type GetGoalsQuery = z.infer<typeof getGoalsQuerySchema>;
