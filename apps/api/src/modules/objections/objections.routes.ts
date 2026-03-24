import { Router } from "express";
import { objectionsController } from "./objections.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
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

// ═══ Objection Categories ═══
router.get("/categories", objectionsController.listCategories);
router.post("/categories", validate({ body: createObjCategorySchema }), objectionsController.createCategory);
router.put("/categories/:id", validate({ params: idParamSchema, body: updateObjCategorySchema }), objectionsController.updateCategory);
router.delete("/categories/:id", validate({ params: idParamSchema }), objectionsController.deleteCategory);

// ═══ Objections ═══
router.get("/", objectionsController.listObjections);
router.post("/", validate({ body: createObjectionSchema }), objectionsController.createObjection);
router.put("/:id", validate({ params: idParamSchema, body: updateObjectionSchema }), objectionsController.updateObjection);
router.patch("/:id/toggle", validate({ params: idParamSchema }), objectionsController.toggleObjection);
router.delete("/:id", validate({ params: idParamSchema }), objectionsController.deleteObjection);

export const objectionsRoutes = router;
