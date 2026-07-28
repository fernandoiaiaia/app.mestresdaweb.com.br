import { Router } from "express";
import { institutionalController } from "./institutional.controller.js";
import { authMiddleware, requirePermission } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { upsertInstitutionalSchema } from "./institutional.schemas.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router: Router = Router();

router.use(authMiddleware);

const requireView = requirePermission("settings.institutional", "view");
const requireManage = requirePermission("settings.institutional", "manage");

const uploadDir = path.join(process.cwd(), "uploads", "certificates");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

router.get("/", requireView, institutionalController.get);
router.put("/", requireManage, validate({ body: upsertInstitutionalSchema }), institutionalController.upsert);
router.post("/certificate", requireManage, upload.single("certificate"), institutionalController.uploadCertificate);

export const institutionalRoutes = router;
