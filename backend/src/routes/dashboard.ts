import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  getFinancialSummary,
  getTrends,
  getCategoryBreakdown,
  getRecentTransactions,
} from "../controllers/dashboard.controller";

const router = Router();

router.use(authenticate);

router.get("/summary", getFinancialSummary);
router.get("/trends", getTrends);
router.get("/category-breakdown", getCategoryBreakdown);
router.get("/recent-transactions", getRecentTransactions);

export default router;
