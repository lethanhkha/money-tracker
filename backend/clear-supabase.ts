import { PrismaClient } from "@prisma/client";

const supabaseDb = new PrismaClient({
  datasourceUrl:
    "postgresql://postgres.jtrdaromvymadaznrqct:tuyetnga0608@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres",
});

async function clearSupabaseData() {
  try {
    console.log("🗑️  Starting to clear Supabase data...");

    // Delete in correct order (children first, then parents)
    try {
      console.log("Deleting goal contributions...");
      await supabaseDb.goalContribution.deleteMany();
    } catch (e: any) {
      console.log("⚠️  Goal contributions table not found, skipping...");
    }

    try {
      console.log("Deleting debt payments...");
      await supabaseDb.debtPayment.deleteMany();
    } catch (e: any) {
      console.log("⚠️  Debt payments table not found, skipping...");
    }

    try {
      console.log("Deleting transactions...");
      await supabaseDb.transaction.deleteMany();
    } catch (e: any) {
      console.log("⚠️  Transactions table not found, skipping...");
    }

    try {
      console.log("Deleting goals...");
      await supabaseDb.goal.deleteMany();
    } catch (e: any) {
      console.log("⚠️  Goals table not found, skipping...");
    }

    try {
      console.log("Deleting debts...");
      await supabaseDb.debt.deleteMany();
    } catch (e: any) {
      console.log("⚠️  Debts table not found, skipping...");
    }

    try {
      console.log("Deleting categories...");
      await supabaseDb.category.deleteMany();
    } catch (e: any) {
      console.log("⚠️  Categories table not found, skipping...");
    }

    try {
      console.log("Deleting wallets...");
      await supabaseDb.wallet.deleteMany();
    } catch (e: any) {
      console.log("⚠️  Wallets table not found, skipping...");
    }

    try {
      console.log("Deleting users...");
      await supabaseDb.user.deleteMany();
    } catch (e: any) {
      console.log("⚠️  Users table not found, skipping...");
    }

    console.log("✅ All data cleared from Supabase!");
  } catch (error) {
    console.error("❌ Error clearing data:", error);
    throw error;
  } finally {
    await supabaseDb.$disconnect();
  }
}

clearSupabaseData();
