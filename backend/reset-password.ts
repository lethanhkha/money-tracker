import { prisma } from "./src/lib/prisma.js";
import bcrypt from "bcryptjs";

async function resetPassword() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error("Usage: npx tsx reset-password.ts <email> <new-password>");
    console.error(
      "Example: npx tsx reset-password.ts user2@gmail.com password123"
    );
    process.exit(1);
  }

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    console.log(`✓ Password updated successfully for ${email}`);
    console.log(`New password: ${newPassword}`);
    console.log(`New hash: ${hashedPassword.substring(0, 20)}...`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
