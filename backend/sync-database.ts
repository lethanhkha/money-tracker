import { PrismaClient } from "@prisma/client";

const sourceDb = new PrismaClient({
  datasourceUrl:
    "postgresql://postgres:sapassword@localhost:5432/quanlychitieu",
});

const targetDb = new PrismaClient({
  datasourceUrl:
    "postgresql://postgres.jtrdaromvymadaznrqct:tuyetnga0608@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres",
});

async function syncData() {
  try {
    console.log("🔄 Starting data sync...");

    // Get all data from source
    const users = await sourceDb.user.findMany();
    const wallets = await sourceDb.wallet.findMany();
    const categories = await sourceDb.category.findMany();
    const transactions = await sourceDb.transaction.findMany();
    const debts = await sourceDb.debt.findMany();
    const debtPayments = await sourceDb.debtPayment.findMany();
    const goals = await sourceDb.goal.findMany();
    const goalContributions = await sourceDb.goalContribution.findMany();

    console.log(
      `📊 Found: ${users.length} users, ${wallets.length} wallets, ${categories.length} categories`
    );
    console.log(
      `📊 Found: ${transactions.length} transactions, ${debts.length} debts, ${goals.length} goals`
    );

    // Insert into target database
    if (users.length > 0) {
      console.log("👤 Syncing users...");
      for (const user of users) {
        await targetDb.user.upsert({
          where: { id: user.id },
          update: user,
          create: user,
        });
      }
    }

    if (wallets.length > 0) {
      console.log("💰 Syncing wallets...");
      for (const wallet of wallets) {
        await targetDb.wallet.upsert({
          where: { id: wallet.id },
          update: wallet,
          create: wallet,
        });
      }
    }

    if (categories.length > 0) {
      console.log("📁 Syncing categories...");
      for (const category of categories) {
        await targetDb.category.upsert({
          where: { id: category.id },
          update: category,
          create: category,
        });
      }
    }

    if (transactions.length > 0) {
      console.log("💸 Syncing transactions...");
      for (const transaction of transactions) {
        await targetDb.transaction.upsert({
          where: { id: transaction.id },
          update: transaction,
          create: transaction,
        });
      }
    }

    if (debts.length > 0) {
      console.log("🏦 Syncing debts...");
      for (const debt of debts) {
        await targetDb.debt.upsert({
          where: { id: debt.id },
          update: debt,
          create: debt,
        });
      }
    }

    if (debtPayments.length > 0) {
      console.log("💳 Syncing debt payments...");
      for (const payment of debtPayments) {
        await targetDb.debtPayment.upsert({
          where: { id: payment.id },
          update: payment,
          create: payment,
        });
      }
    }

    if (goals.length > 0) {
      console.log("🎯 Syncing goals...");
      for (const goal of goals) {
        await targetDb.goal.upsert({
          where: { id: goal.id },
          update: goal,
          create: goal,
        });
      }
    }

    if (goalContributions.length > 0) {
      console.log("📈 Syncing goal contributions...");
      for (const contribution of goalContributions) {
        await targetDb.goalContribution.upsert({
          where: { id: contribution.id },
          update: contribution,
          create: contribution,
        });
      }
    }

    console.log("✅ Data sync completed successfully!");
  } catch (error) {
    console.error("❌ Error syncing data:", error);
    throw error;
  } finally {
    await sourceDb.$disconnect();
    await targetDb.$disconnect();
  }
}

syncData()
  .catch(console.error)
  .finally(async () => {
    process.exit(0);
  });
