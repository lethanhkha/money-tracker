import { Response } from "express";
import { AuthRequest } from "../types";
import { prisma } from "../lib/prisma";
import {
  createWalletSchema,
  updateWalletSchema,
} from "../validators/wallet.validator";
import { z } from "zod";

/**
 * Create a new wallet
 */
export const createWallet = async (req: AuthRequest, res: Response) => {
  try {
    const data = createWalletSchema.parse(req.body);
    const userId = req.user!.userId;

    // Check if this is the first wallet for the user
    const existingWallets = await prisma.wallet.count({
      where: { userId },
    });

    const isFirstWallet = existingWallets === 0;

    const wallet = await prisma.wallet.create({
      data: {
        name: data.name,
        balance: data.balance,
        currency: data.currency,
        icon: data.icon,
        color: data.color,
        isDefault: isFirstWallet, // First wallet is default
        user: {
          connect: { id: userId },
        },
      },
    });

    res
      .status(201)
      .json({ message: "Wallet created successfully", data: wallet });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Create wallet error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get all wallets for the authenticated user
 */
export const getUserWallets = async (req: AuthRequest, res: Response) => {
  try {
    const wallets = await prisma.wallet.findMany({
      where: { userId: req.user!.userId },
      orderBy: [
        { isDefault: "desc" }, // Default wallet first
        { createdAt: "desc" },
      ],
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    res.json({ data: wallets });
  } catch (error) {
    console.error("Get wallets error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get a single wallet by ID
 */
export const getWalletById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const wallet = await prisma.wallet.findUnique({
      where: { id },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    if (wallet.userId !== req.user!.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json({ data: wallet });
  } catch (error) {
    console.error("Get wallet error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Update a wallet (name, icon, color only - not balance)
 */
export const updateWallet = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateWalletSchema.parse(req.body);

    const wallet = await prisma.wallet.findUnique({ where: { id } });

    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    if (wallet.userId !== req.user!.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const updatedWallet = await prisma.wallet.update({
      where: { id },
      data,
    });

    res.json({ message: "Wallet updated successfully", data: updatedWallet });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Update wallet error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Delete a wallet
 */
export const deleteWallet = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const wallet = await prisma.wallet.findUnique({
      where: { id },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    if (wallet.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Check if wallet has transactions
    if (wallet._count.transactions > 0) {
      return res.status(400).json({
        error: "Cannot delete wallet with existing transactions",
        transactionCount: wallet._count.transactions,
      });
    }

    // If deleting default wallet, reassign to another wallet
    if (wallet.isDefault) {
      const otherWallet = await prisma.wallet.findFirst({
        where: {
          userId,
          id: { not: id },
        },
      });

      if (otherWallet) {
        await prisma.wallet.update({
          where: { id: otherWallet.id },
          data: { isDefault: true },
        });
      }
    }

    await prisma.wallet.delete({ where: { id } });

    res.json({ message: "Wallet deleted successfully" });
  } catch (error) {
    console.error("Delete wallet error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Set a wallet as default
 */
export const setDefaultWallet = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const wallet = await prisma.wallet.findUnique({ where: { id } });

    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    if (wallet.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Remove default from all user's wallets
      await tx.wallet.updateMany({
        where: { userId },
        data: { isDefault: false },
      });

      // Set this wallet as default
      await tx.wallet.update({
        where: { id },
        data: { isDefault: true },
      });
    });

    res.json({ message: "Default wallet updated successfully" });
  } catch (error) {
    console.error("Set default wallet error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
