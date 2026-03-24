import { Router } from "express";
import { backupController } from "./backup.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router: Router = Router();
router.use(authMiddleware);

// Settings
router.get("/settings", backupController.getSettings);
router.put("/settings", backupController.upsertSettings);

// Stats
router.get("/stats", backupController.getStats);

// History
router.get("/history", backupController.listHistory);
router.delete("/history/:id", backupController.deleteEntry);

// Actions
router.post("/create", backupController.createBackup);
router.get("/download/:id", backupController.downloadBackup);
router.post("/restore/:id", backupController.restoreBackup);
router.post("/export", backupController.exportData);
router.post("/delete-data", backupController.deleteData);

export const backupRoutes = router;
