import { Router } from "express";
import { objectionsController } from "./objections.controller.js";
import { authMiddleware, requirePermission } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
    createObjCategorySchema,
    updateObjCategorySchema,
    createObjectionSchema,
    updateObjectionSchema,
    idParamSchema,
} from "./objections.schemas.js";

const router: Router = Router();

router.use(authMiddleware);

const requireManage = requirePermission("settings.objections", "manage");

// ═══ Objection Categories ═══
router.get("/categories", objectionsController.listCategories);
router.post("/categories",
    requireManage, validate({ body: createObjCategorySchema }), objectionsController.createCategory);
router.put("/categories/:id",
    requireManage, validate({ params: idParamSchema, body: updateObjCategorySchema }), objectionsController.updateCategory);
router.delete("/categories/:id",
    requireManage, validate({ params: idParamSchema }), objectionsController.deleteCategory);

// ═══ Objections ═══
router.get("/", objectionsController.listObjections);
router.post("/",
    requireManage, validate({ body: createObjectionSchema }), objectionsController.createObjection);
router.put("/:id",
    requireManage, validate({ params: idParamSchema, body: updateObjectionSchema }), objectionsController.updateObjection);
router.patch("/:id/toggle",
    requireManage, validate({ params: idParamSchema }), objectionsController.toggleObjection);
router.delete("/:id",
    requireManage, validate({ params: idParamSchema }), objectionsController.deleteObjection);

export const objectionsRoutes = router;
