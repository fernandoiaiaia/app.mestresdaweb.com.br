import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { domainController } from "./domain.controller.js";
import { authMiddleware, requireRole } from "../../middlewares/auth.middleware.js";
import { createSafeFileFilter, ALLOWED_IMAGE_MIMES } from "../../lib/file-filter.js";

const uploadDir = path.resolve(process.cwd(), "storage", "uploads", "domain");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
    },
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: createSafeFileFilter(ALLOWED_IMAGE_MIMES)
});

const router: Router = Router();
router.use(authMiddleware);

const requireAdmin = requireRole("OWNER", "ADMIN");

router.get("/settings", domainController.getSettings);
router.put("/settings", requireAdmin, domainController.upsertSettings);
router.post("/check-subdomain", requireAdmin, domainController.checkSubdomain);
router.post("/verify-domain", requireAdmin, domainController.verifyDomain);
router.delete("/remove-domain", requireAdmin, domainController.removeDomain);
router.post("/upload/:type", requireAdmin, upload.single("file"), domainController.uploadFile);
router.delete("/file/:type", requireAdmin, domainController.removeFile);

export const domainRoutes = router;
