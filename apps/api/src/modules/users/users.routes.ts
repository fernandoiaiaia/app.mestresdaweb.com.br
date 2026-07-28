import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { usersController } from "./users.controller.js";
import { authMiddleware, requirePermission } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { createSafeFileFilter, ALLOWED_IMAGE_MIMES } from "../../lib/file-filter.js";
import {
    updateUserSchema,
    userParamsSchema,
    createUserSchema,
    updateUserFullSchema,
    changePasswordSchema,
    toggle2faSchema,
} from "./users.schemas.js";

// ═══ Multer config for avatar uploads ═══
const avatarDir = path.resolve(process.cwd(), "storage", "uploads", "avatars");
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });

const avatarStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, avatarDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname) || ".jpg";
        cb(null, `avatar-${Date.now()}${ext}`);
    },
});

const avatarUpload = multer({
    storage: avatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: createSafeFileFilter(ALLOWED_IMAGE_MIMES),
});

const router: Router = Router();

// All routes require authentication
router.use(authMiddleware);

// ═══ Self-service routes ═══
router.get("/me", usersController.getProfile);
router.patch("/me", validate({ body: updateUserSchema }), usersController.updateProfile);
router.post("/me/password", validate({ body: changePasswordSchema }), usersController.changePassword);
router.patch("/me/2fa", validate({ body: toggle2faSchema }), usersController.toggle2fa);
router.post("/me/avatar", avatarUpload.single("avatar"), usersController.uploadAvatar);

// ═══ Admin routes ═══
const requireManage = requirePermission("settings.users", "manage");

// Allowing all authenticated users to list users for CRM dropdown assignments
router.get("/", usersController.listUsers);
router.get("/:id", requireManage, validate({ params: userParamsSchema }), usersController.getUserById);
router.post("/", requireManage, validate({ body: createUserSchema }), usersController.createUser);
router.put("/:id", requireManage, validate({ params: userParamsSchema, body: updateUserFullSchema }), usersController.updateUser);
router.post("/:id/resend-invite", requireManage, validate({ params: userParamsSchema }), usersController.resendInvite);
router.delete("/:id", requireManage, validate({ params: userParamsSchema }), usersController.deleteUser);

export const usersRoutes = router;
