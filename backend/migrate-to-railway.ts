// backend/migrate-to-railway.ts
import { PrismaClient } from "@prisma/client";

const sourceDb = new PrismaClient({
  datasources: { db: { url: process.env.LOCAL_DATABASE_URL } },
});

const destDb = new PrismaClient({
  datasources: { db: { url: process.env.RAILWAY_DATABASE_URL } },
});

async function migrate() {
  console.log("🔄 Starting migration from Local to Railway...");

  // Run migrations on Railway first
  console.log("📦 Running Prisma migrations on Railway...");
  // You need to run: npx prisma migrate deploy manually with RAILWAY_DATABASE_URL

  // Copy users
  console.log("👤 Copying users...");
  const users = await sourceDb.user.findMany();
  for (const user of users) {
    await destDb.user.upsert({
      where: { email: user.email },
      create: user,
      update: user,
    });
  }
  console.log(`✅ Copied ${users.length} users`);

  // Copy wallets
  console.log("💰 Copying wallets...");
  const wallets = await sourceDb.wallet.findMany();
  for (const wallet of wallets) {
    await destDb.wallet.upsert({
      where: { id: wallet.id },
      create: wallet,
      update: wallet,
    });
  }
  console.log(`✅ Copied ${wallets.length} wallets`);

  // Copy categories
  console.log("📁 Copying categories...");
  const categories = await sourceDb.category.findMany();
  for (const category of categories) {
    await destDb.category.upsert({
      where: { id: category.id },
      create: category,
      update: category,
    });
  }
  console.log(`✅ Copied ${categories.length} categories`);

  // Copy transactions
  console.log("💳 Copying transactions...");
  const transactions = await sourceDb.transaction.findMany();
  for (const transaction of transactions) {
    await destDb.transaction.upsert({
      where: { id: transaction.id },
      create: transaction,
      update: transaction,
    });
  }
  console.log(`✅ Copied ${transactions.length} transactions`);

  // Copy debts
  console.log("💸 Copying debts...");
  const debts = await sourceDb.debt.findMany();
  for (const debt of debts) {
    await destDb.debt.upsert({
      where: { id: debt.id },
      create: debt,
      update: debt,
    });
  }
  console.log(`✅ Copied ${debts.length} debts`);

  // Copy goals
  console.log("🎯 Copying goals...");
  const goals = await sourceDb.goal.findMany();
  for (const goal of goals) {
    await destDb.goal.upsert({
      where: { id: goal.id },
      create: goal,
      update: goal,
    });
  }
  console.log(`✅ Copied ${goals.length} goals`);

  console.log("✅ Migration completed!");
}

migrate()
  .catch((e) => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await sourceDb.$disconnect();
    await destDb.$disconnect();
  });
