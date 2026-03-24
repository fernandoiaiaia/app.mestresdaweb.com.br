import { Router } from "express";
import { productsController } from "./products.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
    createProductCategorySchema,
    updateProductCategorySchema,
    createProductSchema,
    updateProductSchema,
    idParamSchema,
} from "./products.schemas.js";

const router: Router = Router();

router.use(authMiddleware);

// ═══ Categories ═══
router.get("/categories", productsController.listCategories);

router.post(
    "/categories",
    validate({ body: createProductCategorySchema }),
    productsController.createCategory
);

router.put(
    "/categories/:id",
    validate({ params: idParamSchema, body: updateProductCategorySchema }),
    productsController.updateCategory
);

router.delete(
    "/categories/:id",
    validate({ params: idParamSchema }),
    productsController.deleteCategory
);

// ═══ Products ═══
router.get("/", productsController.listProducts);

router.get(
    "/:id",
    validate({ params: idParamSchema }),
    productsController.getProduct
);

router.post(
    "/",
    validate({ body: createProductSchema }),
    productsController.createProduct
);

router.put(
    "/:id",
    validate({ params: idParamSchema, body: updateProductSchema }),
    productsController.updateProduct
);

router.patch(
    "/:id/toggle",
    validate({ params: idParamSchema }),
    productsController.toggleActive
);

router.delete(
    "/:id",
    validate({ params: idParamSchema }),
    productsController.deleteProduct
);

export const productsRoutes = router;
