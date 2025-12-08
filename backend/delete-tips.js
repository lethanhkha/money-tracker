const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function deleteTips() {
  const userId = "8f34a16a-f66d-470f-acf4-21b1b6a275d8";

  try {
    // Find tips category
    const category = await prisma.category.findFirst({
      where: {
        userId,
        name: "Tiền tips",
      },
    });

    if (!category) {
      console.log("Không tìm thấy category Tiền tips");
      return;
    }

    // Delete all transactions for this category
    const result = await prisma.transaction.deleteMany({
      where: {
        userId,
        categoryId: category.id,
      },
    });

    console.log(`Đã xóa ${result.count} giao dịch tips`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteTips();
