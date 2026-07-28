import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { devDocumentsController } from "./dev-documents.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { createSafeFileFilter } from "../../lib/file-filter.js";

// ═══════════════════════════════════════
// ProposalAI — Dev Documents Routes
// ═══════════════════════════════════════

// ── Multer for document uploads ──
const uploadsDir = path.resolve(process.cwd(), "uploads", "project-documents");
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
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    fileFilter: createSafeFileFilter()
});

const router: Router = Router();

// ── Public route for downloads (for embedding/viewing) ──
router.get("/:id/download", devDocumentsController.download);

router.use(authMiddleware);

// ── Project-scoped routes ──
router.get("/project/:projectId", devDocumentsController.listByProject);
router.get("/project/:projectId/counts", devDocumentsController.countByType);
router.get("/project/:projectId/type/:docType", devDocumentsController.listByType);
router.post("/project/:projectId/type/:docType", upload.single("file"), devDocumentsController.upload);

// ── Document-specific routes ──
router.get("/:id", devDocumentsController.getById);
router.delete("/:id", devDocumentsController.delete);

// ── Signature routes ──
router.post("/signatures/:sigId/send-code", devDocumentsController.sendCode);
router.post("/:id/send-all", devDocumentsController.sendAllCodes);
router.post("/signatures/:sigId/validate", devDocumentsController.validateCode);

export default router;
