import { Router } from "express";
import { authenticate } from "../middleware/auth";
import * as categoryController from "../controllers/categories.controller";

const router = Router();

// All routes protected
router.use(authenticate);

router.post("/", categoryController.createCategory);
router.get("/", categoryController.getUserCategories);
router.get("/:id", categoryController.getCategoryById);
router.put("/:id", categoryController.updateCategory);
router.delete("/:id", categoryController.deleteCategory);

export default router;
