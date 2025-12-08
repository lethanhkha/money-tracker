const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkTipsCount() {
  const userId = "8f34a16a-f66d-470f-acf4-21b1b6a275d8";

  try {
    // Get all transactions to check dates
    const allTransactions = await prisma.transaction.findMany({
      where: {
        userId,
      },
      orderBy: {
        date: "desc",
      },
      take: 20,
      select: {
        date: true,
        amount: true,
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log("20 giao dịch mới nhất trong database:");
    allTransactions.forEach((t, i) => {
      const date = new Date(t.date);
      console.log(
        `${i + 1}. ${date.toLocaleDateString(
          "vi-VN"
        )} ${date.toLocaleTimeString("vi-VN")}: ${t.amount.toLocaleString(
          "vi-VN"
        )} VND - ${t.category.name}`
      );
    });

    // Count by month
    console.log("\n\nĐếm theo tháng:");
    const months = {};
    const allForCount = await prisma.transaction.findMany({
      where: { userId },
      select: { date: true },
    });

    allForCount.forEach((t) => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      months[key] = (months[key] || 0) + 1;
    });

    Object.entries(months)
      .sort(([a], [b]) => b.localeCompare(a))
      .forEach(([month, count]) => {
        console.log(`${month}: ${count} giao dịch`);
      });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTipsCount();
