import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import {
  createCategorySchema,
  updateCategorySchema,
  getCategoriesQuerySchema,
} from "../validators/category.validator";
import { z } from "zod";

/**
 * Create a new category
 */
export const createCategory = async (req: Request, res: Response) => {
  try {
    const data = createCategorySchema.parse(req.body);

    const category = await prisma.category.create({
      data: {
        name: data.name,
        type: data.type,
        icon: data.icon,
        color: data.color,
        user: {
          connect: { id: req.user!.userId },
        },
      },
    });

    res
      .status(201)
      .json({ message: "Category created successfully", data: category });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Create category error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get all categories for the authenticated user
 */
export const getUserCategories = async (req: Request, res: Response) => {
  try {
    const query = getCategoriesQuerySchema.parse(req.query);

    const whereClause: any = { userId: req.user!.userId };

    if (query.type) {
      whereClause.type = query.type;
    }

    const categories = await prisma.category.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    res.json({ data: categories });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Get categories error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get a single category by ID
 */
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    if (category.userId !== req.user!.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json({ data: category });
  } catch (error) {
    console.error("Get category error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Update a category (name, icon, color only - not type)
 */
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateCategorySchema.parse(req.body);

    const category = await prisma.category.findUnique({ where: { id } });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    if (category.userId !== req.user!.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data,
    });

    res.json({
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Update category error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Delete a category
 */
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    if (category.userId !== req.user!.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Check if category has transactions
    if (category._count.transactions > 0) {
      return res.status(400).json({
        error: "Cannot delete category with existing transactions",
        transactionCount: category._count.transactions,
      });
    }

    await prisma.category.delete({ where: { id } });

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
