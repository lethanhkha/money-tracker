import { z } from "zod";

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Tên danh mục phải có ít nhất 2 ký tự")
    .max(50, "Tên danh mục không được quá 50 ký tự"),
  type: z.enum(["income", "expense"], {
    required_error: "Loại danh mục là bắt buộc",
  }),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Tên danh mục phải có ít nhất 2 ký tự")
    .max(50, "Tên danh mục không được quá 50 ký tự")
    .optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export const getCategoriesQuerySchema = z.object({
  type: z.enum(["income", "expense"]).optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type GetCategoriesQuery = z.infer<typeof getCategoriesQuerySchema>;
