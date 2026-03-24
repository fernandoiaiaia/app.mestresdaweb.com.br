import { Router } from "express";
import { companiesController } from "./companies.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
    createCompanySchema,
    updateCompanySchema,
    companyParamsSchema,
} from "./companies.schemas.js";

const router: Router = Router();

router.use(authMiddleware);

router.get("/", companiesController.list);

router.post(
    "/",
    validate({ body: createCompanySchema }),
    companiesController.create
);

router.get(
    "/:id",
    validate({ params: companyParamsSchema }),
    companiesController.getById
);

router.put(
    "/:id",
    validate({ params: companyParamsSchema, body: updateCompanySchema }),
    companiesController.update
);

router.delete(
    "/:id",
    validate({ params: companyParamsSchema }),
    companiesController.delete
);

export const companiesRoutes = router;
