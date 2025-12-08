const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

// Wallet mapping
const walletMap = {
  "68d79725603139db5644f0c1": "tiền mặt",
  "68d809b4603139db5644f32c": "techcombank",
  "68d809bc603139db5644f333": "momo",
  "68d809c2603139db5644f33a": "timo",
  "68d89a09603139db5644f402": "vietcombank",
};

const userId = "8f34a16a-f66d-470f-acf4-21b1b6a275d8";

async function importTips() {
  try {
    // Read JSON file
    const jsonPath = "C:\\Users\\Admin\\Downloads\\expense-tracker.tips.json";
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

    console.log(`Found ${data.length} tips records`);

    // Get user's wallets
    const wallets = await prisma.wallet.findMany({
      where: { userId },
    });

    console.log(`User has ${wallets.length} wallets`);

    // Create wallet lookup by name (case insensitive)
    const walletLookup = {};
    wallets.forEach((w) => {
      walletLookup[w.name.toLowerCase()] = w.id;
    });

    // Find or create "Tiền tips" category
    let tipsCategory = await prisma.category.findFirst({
      where: {
        userId,
        type: "income",
        name: {
          equals: "Tiền tips",
          mode: "insensitive",
        },
      },
    });

    if (!tipsCategory) {
      console.log("Creating Tiền tips category...");
      tipsCategory = await prisma.category.create({
        data: {
          userId,
          name: "Tiền tips",
          type: "income",
          icon: "💸",
          color: "#a855f7",
        },
      });
    }

    console.log(`Using category: ${tipsCategory.name} (${tipsCategory.id})`);

    let successCount = 0;
    let errorCount = 0;

    for (const tip of data) {
      try {
        const walletOid = tip.walletId.$oid;
        const walletName = walletMap[walletOid];

        if (!walletName) {
          console.log(`Unknown wallet ID: ${walletOid}`);
          errorCount++;
          continue;
        }

        const walletId = walletLookup[walletName.toLowerCase()];
        if (!walletId) {
          console.log(`Wallet not found for user: ${walletName}`);
          errorCount++;
          continue;
        }

        // Parse date
        const originalDate = new Date(tip.date.$date);
        const workDate = new Date(
          Date.UTC(
            originalDate.getUTCFullYear(),
            originalDate.getUTCMonth(),
            originalDate.getUTCDate(),
            0, // 7 AM GMT+7 = 0 AM UTC
            0,
            0
          )
        );

        // Received date = work date + 1 day
        const receivedDate = new Date(workDate);
        receivedDate.setUTCDate(receivedDate.getUTCDate() + 1);

        // Build description
        const descParts = [];
        if (tip.customer && tip.customer.trim()) {
          descParts.push(tip.customer.trim());
        }
        if (tip.note && tip.note.trim()) {
          descParts.push(tip.note.trim());
        }
        const description = descParts.join(" - ") || null;

        const status = tip.received ? "completed" : "pending";

        // Create transaction
        await prisma.transaction.create({
          data: {
            userId,
            walletId,
            categoryId: tipsCategory.id,
            type: "income",
            amount: tip.amount,
            description,
            date: workDate, // Use work date as main date
            workDate: workDate, // Original work date
            receivedDate: tip.received ? receivedDate : null,
            status,
          },
        });

        successCount++;
        if (successCount % 100 === 0) {
          console.log(`Imported ${successCount} transactions...`);
        }
      } catch (err) {
        console.error(`Error importing tip:`, err.message);
        errorCount++;
      }
    }

    console.log(`\nImport complete!`);
    console.log(`Success: ${successCount}`);
    console.log(`Errors: ${errorCount}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error("Import failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

importTips();
