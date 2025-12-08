const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const prisma = new PrismaClient();

async function importExpenses() {
  const userId = "8f34a16a-f66d-470f-acf4-21b1b6a275d8";

  try {
    // Get expense categories
    const categories = await prisma.category.findMany({
      where: {
        userId,
        type: "expense",
      },
      select: {
        id: true,
        name: true,
        icon: true,
      },
    });

    console.log("Expense categories:");
    categories.forEach((c) => console.log(`- ${c.icon} ${c.name} (${c.id})`));

    // Get wallets
    const wallets = await prisma.wallet.findMany({
      where: { userId },
      select: { id: true, name: true },
    });

    console.log("\nWallets:");
    wallets.forEach((w) => console.log(`- ${w.name} (${w.id})`));

    // Read expenses JSON
    const expensesData = JSON.parse(
      fs.readFileSync(
        "c:\\Users\\Admin\\Downloads\\expense-tracker.expenses.json",
        "utf8"
      )
    );

    console.log(`\nFound ${expensesData.length} expense records`);

    // Wallet ID mapping (from MongoDB ObjectId to wallet name)
    const walletMap = {
      "68d79725603139db5644f0c1": "tiền mặt",
      "68d7973a603139db5644f0c5": "techcombank",
      "68d7975b603139db5644f0c9": "momo",
      "68d7976e603139db5644f0cd": "timo",
      "68daf5f6603139db564527e0": "vietcombank",
    };

    // Category mapping based on keywords
    const categoryMapping = {
      "Ăn uống": [
        "bánh",
        "cơm",
        "ăn",
        "cf",
        "mì",
        "nui",
        "bún",
        "gỏi",
        "trà",
        "nước",
        "suối",
        "dừa",
        "trái cây",
        "cam",
        "tsua",
        "sữa",
        "bee",
        "phô mai",
      ],
      "Di chuyển": ["gửi xe", "xăng"],
      "Mua sắm": ["shoppee", "bhx", "mms"],
      "Nhà cửa": ["nhà", "tiền nhà"],
      "Sức khỏe": ["thuốc", "thay băng"],
      Khác: ["hh", "hụi", "quỹ", "4g", "nợ", "gửi về", "gửi tk", "sn", "chơi"],
    };

    // Find category by keywords
    const findCategory = (source, note) => {
      const text = `${source} ${note}`.toLowerCase();

      for (const [categoryName, keywords] of Object.entries(categoryMapping)) {
        for (const keyword of keywords) {
          if (text.includes(keyword)) {
            const category = categories.find((c) => c.name === categoryName);
            if (category) return category.id;
          }
        }
      }

      // Default to "Khác"
      const defaultCategory = categories.find((c) => c.name === "Khác");
      return defaultCategory?.id || categories[0]?.id;
    };

    let success = 0;
    let errors = 0;

    for (const expense of expensesData) {
      try {
        // Map wallet
        const walletName = walletMap[expense.walletId.$oid];
        const wallet = wallets.find(
          (w) => w.name.toLowerCase() === walletName?.toLowerCase()
        );

        if (!wallet) {
          console.error(`Wallet not found for ${expense.walletId.$oid}`);
          errors++;
          continue;
        }

        // Find category
        const categoryId = findCategory(expense.source, expense.note || "");

        // Parse date
        const date = new Date(expense.date.$date);

        // Create description
        const description = expense.note
          ? `${expense.source} - ${expense.note}`
          : expense.source;

        // Create transaction
        await prisma.transaction.create({
          data: {
            userId,
            walletId: wallet.id,
            categoryId,
            type: "expense",
            amount: expense.amount,
            description,
            date: date,
            status: "completed",
          },
        });

        success++;
        if (success % 50 === 0) {
          console.log(`Imported ${success} expenses...`);
        }
      } catch (error) {
        console.error(`Error importing expense:`, error.message);
        errors++;
      }
    }

    console.log(`\nImport complete!`);
    console.log(`Success: ${success}`);
    console.log(`Errors: ${errors}`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

importExpenses();
