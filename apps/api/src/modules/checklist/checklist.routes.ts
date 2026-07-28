import { Router } from "express";
import { checklistController } from "./checklist.controller.js";
import { authMiddleware, requirePermission } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
    createChecklistCategorySchema, updateChecklistCategorySchema,
    createChecklistQuestionSchema, updateChecklistQuestionSchema,
    idParamSchema,
} from "./checklist.schemas.js";

const router: Router = Router();
router.use(authMiddleware);

const requireView = requirePermission("settings.checklist", "view");
const requireManage = requirePermission("settings.checklist", "manage");

// Categories
router.get("/categories", requireView, checklistController.listCategories);
router.post("/categories",
    requireManage, validate({ body: createChecklistCategorySchema }), checklistController.createCategory);
router.put("/categories/:id",
    requireManage, validate({ params: idParamSchema, body: updateChecklistCategorySchema }), checklistController.updateCategory);
router.delete("/categories/:id",
    requireManage, validate({ params: idParamSchema }), checklistController.deleteCategory);

// Questions
router.get("/", requireView, checklistController.listQuestions);
router.post("/",
    requireManage, validate({ body: createChecklistQuestionSchema }), checklistController.createQuestion);
router.put("/:id",
    requireManage, validate({ params: idParamSchema, body: updateChecklistQuestionSchema }), checklistController.updateQuestion);
router.delete("/:id",
    requireManage, validate({ params: idParamSchema }), checklistController.deleteQuestion);

export const checklistRoutes = router;
