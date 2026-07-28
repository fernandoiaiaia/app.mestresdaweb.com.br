import { Router } from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { transactionsController } from "./transactions.controller.js";
import { financialSetupController } from "./financial-setup.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { createSafeFileFilter } from "../../lib/file-filter.js";

// Make sure storage path exists
const uploadsDir = path.resolve(process.cwd(), "uploads", "transaction-attachments");
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
        const unique = crypto.randomUUID();
        const ext = path.extname(file.originalname);
        cb(null, `${unique}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB matching frontend UI
    fileFilter: createSafeFileFilter(),
});

const router: Router = Router();

router.use(authMiddleware);

// Setup defaults
router.post("/setup", financialSetupController.setup);

// CRUD
router.get("/", transactionsController.list);
router.get("/:id", transactionsController.getById);
router.post("/", transactionsController.create);
router.put("/:id", transactionsController.update);
router.delete("/:id", transactionsController.delete);

// Batch
router.post("/batch-pay", transactionsController.batchPay);
router.post("/batch-delete", transactionsController.batchDelete);

// Attachments
router.post("/:id/attachments", upload.single("file"), transactionsController.uploadAttachment);
router.get("/:id/attachments/:fileId/download", transactionsController.downloadAttachment);
router.delete("/:id/attachments/:fileId", transactionsController.deleteAttachment);

export const financialTransactionsRoutes: Router = router;
export default router;
