-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "receivedDate" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'completed',
ADD COLUMN     "workDate" TIMESTAMP(3);
