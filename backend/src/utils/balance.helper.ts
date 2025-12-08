import { prisma } from "../lib/prisma";

/**
 * Update wallet balance for a transaction
 */
export async function updateWalletBalance(
  walletId: string,
  amount: number,
  type: "income" | "expense",
  operation: "add" | "remove"
): Promise<void> {
  const wallet = await prisma.wallet.findUnique({
    where: { id: walletId },
  });

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  let newBalance = wallet.balance;

  // Calculate new balance based on operation and type
  if (operation === "add") {
    // Adding transaction effect
    if (type === "income") {
      newBalance += amount;
    } else if (type === "expense") {
      newBalance -= amount;
    }
  } else if (operation === "remove") {
    // Removing/reversing transaction effect
    if (type === "income") {
      newBalance -= amount;
    } else if (type === "expense") {
      newBalance += amount;
    }
  }

  await prisma.wallet.update({
    where: { id: walletId },
    data: { balance: newBalance },
  });
}

/**
 * Validate if wallet has sufficient balance
 */
export async function validateSufficientBalance(
  walletId: string,
  amount: number
): Promise<boolean> {
  const wallet = await prisma.wallet.findUnique({
    where: { id: walletId },
  });

  if (!wallet) {
    return false;
  }

  return wallet.balance >= amount;
}

/**
 * Reverse transaction effect on wallet balance
 */
export async function reverseTransactionEffect(
  walletId: string,
  amount: number,
  type: "income" | "expense"
): Promise<void> {
  await updateWalletBalance(walletId, amount, type, "remove");
}
