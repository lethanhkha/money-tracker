import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  markTipAsReceived,
} from "../controllers/transactions.controller";

const router = Router();

router.use(authenticate);

router.post("/", createTransaction);
router.get("/", getTransactions);
router.get("/:id", getTransactionById);
router.put("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);
router.patch("/:id/mark-received", markTipAsReceived);

export default router;
