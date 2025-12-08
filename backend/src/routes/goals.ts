import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
  addContribution,
  getGoalContributions,
  deleteGoalContribution,
} from "../controllers/goals.controller";

const router = Router();

router.use(authenticate);

router.post("/", createGoal);
router.get("/", getGoals);
router.get("/:id", getGoalById);
router.put("/:id", updateGoal);
router.delete("/:id", deleteGoal);
router.post("/:id/contribute", addContribution);
router.get("/:id/contributions", getGoalContributions);
router.delete("/:id/contributions/:contributionId", deleteGoalContribution);

export default router;
