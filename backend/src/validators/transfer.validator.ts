import { z } from "zod";

export const transferSchema = z.object({
  fromWalletId: z.string().uuid("ID ví nguồn không hợp lệ"),
  toWalletId: z.string().uuid("ID ví đích không hợp lệ"),
  amount: z
    .number()
    .positive("Số tiền phải lớn hơn 0"),
  description: z.string().optional(),
}).refine((data) => data.fromWalletId !== data.toWalletId, {
  message: "Ví nguồn và ví đích phải khác nhau",
  path: ["toWalletId"],
});

export type TransferInput = z.infer<typeof transferSchema>;
