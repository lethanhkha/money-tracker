import { prisma } from "./src/lib/prisma.js";
import bcrypt from "bcryptjs";

async function resetAllPasswords() {
  const newPassword = "newpass123";

  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    console.log(`Found ${users.length} users to reset password\n`);

    // Hash the new password once
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log(`New password hash: ${hashedPassword.substring(0, 30)}...\n`);

    // Update all users with the new password
    for (const user of users) {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      console.log(`✓ ${user.email} (${user.name})`);
    }

    console.log(
      `\n✓ Successfully reset password for all ${users.length} users`
    );
    console.log(`New password: ${newPassword}`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAllPasswords();
