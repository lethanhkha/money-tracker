import { z } from "zod";

export const createDebtSchema = z.object({
  type: z.enum(["lend", "borrow"]),
  personName: z.string().min(2, "Person name must be at least 2 characters"),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
});

export const updateDebtSchema = z.object({
  personName: z.string().min(2).optional(),
  amount: z.number().positive().optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(["pending", "partial", "completed"]).optional(),
});

export const makePaymentSchema = z.object({
  amount: z.number().positive("Payment amount must be positive"),
  paymentDate: z.string().optional(),
  note: z.string().optional(),
});

export const getDebtsQuerySchema = z.object({
  type: z.enum(["lend", "borrow"]).optional(),
  status: z.enum(["pending", "partial", "completed"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export type CreateDebtInput = z.infer<typeof createDebtSchema>;
export type UpdateDebtInput = z.infer<typeof updateDebtSchema>;
export type MakePaymentInput = z.infer<typeof makePaymentSchema>;
export type GetDebtsQuery = z.infer<typeof getDebtsQuerySchema>;
