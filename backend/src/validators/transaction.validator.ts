import { z } from "zod";

export const createTransactionSchema = z.object({
  walletId: z.string().uuid("Wallet ID không hợp lệ"),
  categoryId: z.string().uuid("Category ID không hợp lệ"),
  type: z.enum(["income", "expense"], {
    required_error: "Loại giao dịch là bắt buộc",
  }),
  amount: z.number().positive("Số tiền phải lớn hơn 0"),
  description: z.string().optional(),
  date: z.string().optional(),
  status: z.enum(["pending", "completed"]).default("completed"),
  workDate: z.string().optional(),
  receivedDate: z.string().optional(),
});

export const updateTransactionSchema = z.object({
  walletId: z.string().uuid("Wallet ID không hợp lệ").optional(),
  categoryId: z.string().uuid("Category ID không hợp lệ").optional(),
  type: z.enum(["income", "expense"]).optional(),
  amount: z.number().positive("Số tiền phải lớn hơn 0").optional(),
  description: z.string().optional(),
  date: z.string().optional(),
  status: z.enum(["pending", "completed"]).optional(),
});

export const getTransactionsQuerySchema = z.object({
  walletId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  type: z.enum(["income", "expense"]).optional(),
  status: z.enum(["pending", "completed"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(10000).default(10000),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type GetTransactionsQuery = z.infer<typeof getTransactionsQuerySchema>;
