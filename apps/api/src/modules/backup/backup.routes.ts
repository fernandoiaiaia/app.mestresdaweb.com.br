import { Router } from "express";
import { backupController } from "./backup.controller.js";
import { authMiddleware, requirePermission } from "../../middlewares/auth.middleware.js";

const router: Router = Router();
router.use(authMiddleware);

const requireView = requirePermission("settings.backup", "view");
const requireManage = requirePermission("settings.backup", "manage");

// Settings
router.get("/settings", requireView, backupController.getSettings);
router.put("/settings", requireManage, backupController.upsertSettings);

// Stats
router.get("/stats", requireView, backupController.getStats);

// History
router.get("/history", requireView, backupController.listHistory);
router.delete("/history/:id", requireManage, backupController.deleteEntry);

// Actions
router.post("/create", requireManage, backupController.createBackup);
router.get("/download/:id", requireView, backupController.downloadBackup);
router.post("/restore/:id", requireManage, backupController.restoreBackup);
router.post("/export", requireManage, backupController.exportData);
router.post("/delete-data", requireManage, backupController.deleteData);

export const backupRoutes = router;
