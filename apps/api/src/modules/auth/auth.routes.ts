import { Router } from "express";
import { authController } from "./auth.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { registerSchema, loginSchema, refreshSchema, verify2faSchema, googleLoginSchema, appleLoginSchema, forgotPasswordSchema, resetPasswordSchema } from "./auth.schemas.js";

const router: Router = Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post("/verify-2fa", validate(verify2faSchema), authController.verify2fa);
router.post("/google", validate(googleLoginSchema), authController.googleLogin);
router.post("/apple", validate(appleLoginSchema), authController.appleLogin);
router.post("/refresh", validate(refreshSchema), authController.refresh);
router.post("/logout", authController.logout);
router.post("/forgot-password", validate(forgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), authController.resetPassword);
router.get("/me", authMiddleware, authController.me);

export { router as authRoutes };
