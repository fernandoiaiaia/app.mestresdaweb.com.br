import { Router } from "express";
import { contractsController } from "./contracts.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import multer from "multer";

// Configure multer for local upload temporarily or match transaction style
const upload = multer({ dest: "uploads/" });

const router: Router = Router();

router.use(authMiddleware);

router.get("/", contractsController.list);
router.get("/stats", contractsController.stats);
router.post("/", contractsController.create);
router.get("/deals/search", contractsController.searchDeals);
router.post("/:id/upload", upload.single("file"), contractsController.uploadAttachment);

export default router;
