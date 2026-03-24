import { Router } from "express";
import { checklistController } from "./checklist.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
    createChecklistCategorySchema, updateChecklistCategorySchema,
    createChecklistQuestionSchema, updateChecklistQuestionSchema,
    idParamSchema,
} from "./checklist.schemas.js";

const router: Router = Router();
router.use(authMiddleware);

// Categories
router.get("/categories", checklistController.listCategories);
router.post("/categories", validate({ body: createChecklistCategorySchema }), checklistController.createCategory);
router.put("/categories/:id", validate({ params: idParamSchema, body: updateChecklistCategorySchema }), checklistController.updateCategory);
router.delete("/categories/:id", validate({ params: idParamSchema }), checklistController.deleteCategory);

// Questions
router.get("/", checklistController.listQuestions);
router.post("/", validate({ body: createChecklistQuestionSchema }), checklistController.createQuestion);
router.put("/:id", validate({ params: idParamSchema, body: updateChecklistQuestionSchema }), checklistController.updateQuestion);
router.delete("/:id", validate({ params: idParamSchema }), checklistController.deleteQuestion);

export const checklistRoutes = router;
