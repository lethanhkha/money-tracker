import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  createDebt,
  getDebts,
  getDebtById,
  updateDebt,
  deleteDebt,
  makePartialPayment,
  getDebtPayments,
  deleteDebtPayment,
} from "../controllers/debts.controller";

const router = Router();

router.use(authenticate);

router.post("/", createDebt);
router.get("/", getDebts);
router.get("/:id", getDebtById);
router.put("/:id", updateDebt);
router.delete("/:id", deleteDebt);
router.post("/:id/pay", makePartialPayment);
router.get("/:id/payments", getDebtPayments);
router.delete("/:id/payments/:paymentId", deleteDebtPayment);

export default router;
