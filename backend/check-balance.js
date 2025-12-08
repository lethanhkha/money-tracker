const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkBalance() {
  const userId = "8f34a16a-f66d-470f-acf4-21b1b6a275d8";

  try {
    // Get wallets
    const wallets = await prisma.wallet.findMany({
      where: { userId },
    });

    console.log("Current wallet balances:");
    let totalBalance = 0;
    wallets.forEach((w) => {
      console.log(`- ${w.name}: ${w.balance.toLocaleString()} VND`);
      totalBalance += w.balance;
    });
    console.log(`\nTotal balance: ${totalBalance.toLocaleString()} VND`);

    // Get income (completed only)
    const income = await prisma.transaction.aggregate({
      where: {
        userId,
        type: "income",
        status: "completed",
      },
      _sum: {
        amount: true,
      },
    });

    // Get expense
    const expense = await prisma.transaction.aggregate({
      where: {
        userId,
        type: "expense",
      },
      _sum: {
        amount: true,
      },
    });

    // Get pending tips
    const pendingTips = await prisma.transaction.aggregate({
      where: {
        userId,
        type: "income",
        status: "pending",
      },
      _sum: {
        amount: true,
      },
    });

    console.log(
      `\nTotal income (completed): ${(
        income._sum.amount || 0
      ).toLocaleString()} VND`
    );
    console.log(
      `Total expense: ${(expense._sum.amount || 0).toLocaleString()} VND`
    );
    console.log(
      `Pending tips: ${(pendingTips._sum.amount || 0).toLocaleString()} VND`
    );

    const expectedBalance =
      (income._sum.amount || 0) - (expense._sum.amount || 0);
    console.log(`\nExpected balance: ${expectedBalance.toLocaleString()} VND`);
    console.log(`Actual balance: ${totalBalance.toLocaleString()} VND`);
    console.log(
      `Difference: ${(totalBalance - expectedBalance).toLocaleString()} VND`
    );

    // Check transactions count
    const transCount = await prisma.transaction.count({
      where: { userId },
    });
    console.log(`\nTotal transactions: ${transCount}`);

    // Check by wallet
    console.log(`\n\nBalance by wallet (from transactions):`);
    for (const wallet of wallets) {
      const walletIncome = await prisma.transaction.aggregate({
        where: {
          userId,
          walletId: wallet.id,
          type: "income",
          status: "completed",
        },
        _sum: { amount: true },
      });

      const walletExpense = await prisma.transaction.aggregate({
        where: {
          userId,
          walletId: wallet.id,
          type: "expense",
        },
        _sum: { amount: true },
      });

      const calculated =
        (walletIncome._sum.amount || 0) - (walletExpense._sum.amount || 0);
      console.log(
        `- ${
          wallet.name
        }: Current=${wallet.balance.toLocaleString()}, Calculated=${calculated.toLocaleString()}, Diff=${(
          wallet.balance - calculated
        ).toLocaleString()}`
      );
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBalance();
