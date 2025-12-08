const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function setDefaultWallet() {
  const userId = "8f34a16a-f66d-470f-acf4-21b1b6a275d8";

  try {
    // Find "Tiền mặt" wallet
    const tienMatWallet = await prisma.wallet.findFirst({
      where: {
        userId,
        name: "Tiền mặt",
      },
    });

    if (!tienMatWallet) {
      console.log("Không tìm thấy ví Tiền mặt");
      return;
    }

    // Set as default
    await prisma.$transaction(async (tx) => {
      // Remove default from all wallets
      await tx.wallet.updateMany({
        where: { userId },
        data: { isDefault: false },
      });

      // Set Tiền mặt as default
      await tx.wallet.update({
        where: { id: tienMatWallet.id },
        data: { isDefault: true },
      });
    });

    console.log(`✓ Đã đặt "${tienMatWallet.name}" làm ví mặc định`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

setDefaultWallet();
