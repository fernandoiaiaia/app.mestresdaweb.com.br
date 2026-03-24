import { Router } from "express";
import { securityController } from "./security.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { upsertSecuritySettingsSchema, changePasswordSchema } from "./security.schemas.js";

const router: Router = Router();
router.use(authMiddleware);

// Settings
router.get("/", securityController.getSettings);
router.put("/", validate({ body: upsertSecuritySettingsSchema }), securityController.upsertSettings);

// Password
router.post("/change-password", validate({ body: changePasswordSchema }), securityController.changePassword);

// Sessions
router.get("/sessions", securityController.listSessions);
router.delete("/sessions/:id", securityController.revokeSession);
router.delete("/sessions", securityController.revokeAllOther);

// Login History
router.get("/login-history", securityController.listLoginHistory);

export const securityRoutes = router;
