import { z } from "zod";

export const createWalletSchema = z.object({
  name: z
    .string()
    .min(2, "Tên ví phải có ít nhất 2 ký tự")
    .max(50, "Tên ví không được quá 50 ký tự"),
  balance: z.number().default(0),
  currency: z.string().default("VND"),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export const updateWalletSchema = z.object({
  name: z
    .string()
    .min(2, "Tên ví phải có ít nhất 2 ký tự")
    .max(50, "Tên ví không được quá 50 ký tự")
    .optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export type CreateWalletInput = z.infer<typeof createWalletSchema>;
export type UpdateWalletInput = z.infer<typeof updateWalletSchema>;
