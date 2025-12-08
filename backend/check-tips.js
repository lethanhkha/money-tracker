const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkTipsCategories() {
  try {
    const categories = await prisma.category.findMany({
      where: {
        type: "income",
      },
      select: {
        id: true,
        userId: true,
        name: true,
      },
    });

    console.log("All income categories:");
    console.log("=".repeat(80));

    categories.forEach((c) => {
      const nameLower = c.name.toLowerCase().trim();
      const isTips = nameLower === "tiền tips";
      console.log(`User: ${c.userId}`);
      console.log(`Name: "${c.name}"`);
      console.log(`Name (lower+trim): "${nameLower}"`);
      console.log(`Is Tips: ${isTips}`);
      console.log("-".repeat(80));
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error("Error:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkTipsCategories();
