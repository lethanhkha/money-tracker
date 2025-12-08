import { Router } from "express";
import { authenticate } from "../middleware/auth";
import * as walletController from "../controllers/wallets.controller";

const router = Router();

// All routes protected
router.use(authenticate);

router.post("/", walletController.createWallet);
router.get("/", walletController.getUserWallets);
router.get("/:id", walletController.getWalletById);
router.put("/:id", walletController.updateWallet);
router.put("/:id/set-default", walletController.setDefaultWallet);
router.delete("/:id", walletController.deleteWallet);

export default router;
