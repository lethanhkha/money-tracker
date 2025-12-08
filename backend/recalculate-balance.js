const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function recalculateBalance() {
  const userId = "8f34a16a-f66d-470f-acf4-21b1b6a275d8";

  try {
    const wallets = await prisma.wallet.findMany({
      where: { userId },
    });

    console.log("Recalculating wallet balances...\n");

    for (const wallet of wallets) {
      // Calculate income (completed only)
      const income = await prisma.transaction.aggregate({
        where: {
          userId,
          walletId: wallet.id,
          type: "income",
          status: "completed",
        },
        _sum: {
          amount: true,
        },
      });

      // Calculate expense
      const expense = await prisma.transaction.aggregate({
        where: {
          userId,
          walletId: wallet.id,
          type: "expense",
        },
        _sum: {
          amount: true,
        },
      });

      const newBalance = (income._sum.amount || 0) - (expense._sum.amount || 0);

      console.log(`${wallet.name}:`);
      console.log(`  Old balance: ${wallet.balance.toLocaleString()} VND`);
      console.log(`  Calculated: ${newBalance.toLocaleString()} VND`);
      console.log(
        `  Difference: ${(newBalance - wallet.balance).toLocaleString()} VND`
      );

      // Update wallet balance
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      });

      console.log(`  ✓ Updated\n`);
    }

    // Show final totals
    const updatedWallets = await prisma.wallet.findMany({
      where: { userId },
    });

    let totalBalance = 0;
    console.log("\nFinal wallet balances:");
    updatedWallets.forEach((w) => {
      console.log(`- ${w.name}: ${w.balance.toLocaleString()} VND`);
      totalBalance += w.balance;
    });
    console.log(`\nTotal: ${totalBalance.toLocaleString()} VND`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

recalculateBalance();
