import { Router } from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { dealsController } from "./deals.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
    createDealSchema,
    updateDealSchema,
    updateDealStageSchema,
    dealParamsSchema,
    changeDealFunnelSchema,
    createDealNoteSchema
} from "./deals.schemas.js";

const uploadsDir = path.resolve(process.cwd(), "uploads", "deal-files");
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
        const unique = crypto.randomUUID();
        const ext = path.extname(file.originalname);
        cb(null, `${unique}${ext}`);
    },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB

const router: Router = Router();

router.use(authMiddleware);

router.get("/", dealsController.list);

router.get(
    "/:id",
    validate({ params: dealParamsSchema }),
    dealsController.get
);

router.post(
    "/",
    validate({ body: createDealSchema }),
    dealsController.create
);

router.put(
    "/:id",
    validate({ params: dealParamsSchema, body: updateDealSchema }),
    dealsController.update
);

router.put(
    "/:id/stage",
    validate({ params: dealParamsSchema, body: updateDealStageSchema }),
    dealsController.updateStage
);

router.put(
    "/:id/funnel",
    validate({ params: dealParamsSchema, body: changeDealFunnelSchema }),
    dealsController.changeFunnel
);

router.post(
    "/:id/notes",
    validate({ params: dealParamsSchema, body: createDealNoteSchema }),
    dealsController.addNote
);

router.get(
    "/:id/notes",
    validate({ params: dealParamsSchema }),
    dealsController.getNotes
);

router.delete(
    "/:id",
    validate({ params: dealParamsSchema }),
    dealsController.delete
);

// ═══ File endpoints ═══
router.get(
    "/:id/files",
    validate({ params: dealParamsSchema }),
    dealsController.listFiles
);

router.post(
    "/:id/files",
    upload.single("file"),
    dealsController.uploadFile
);

router.delete(
    "/:id/files/:fileId",
    dealsController.deleteFile
);

router.get(
    "/:id/files/:fileId/download",
    dealsController.downloadFile
);

export const dealsRoutes = router;
