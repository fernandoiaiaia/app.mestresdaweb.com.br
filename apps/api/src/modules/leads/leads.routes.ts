import { Router } from "express";
import { leadsController } from "./leads.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { createLeadPublicSchema } from "./leads.schemas.js";

const router: Router = Router();

// ═══ Public (no auth required) ═══

// Step 1: Create Contact + Company
router.post("/public/contact", leadsController.createPublicContact);

// Step 2: Create Opportunity linked to the contact
router.post("/public/opportunity", leadsController.createPublicOpportunity);

// Final: Update opportunity with budget value + message as note
router.patch("/public/opportunity/:id", leadsController.updatePublicOpportunity);

// Final submit: full lead record
router.post(
    "/public",
    validate({ body: createLeadPublicSchema }),
    leadsController.createPublic
);

// Unified: Create Contact + Opportunity + Notes in one call (mestresdaweb.com.br website forms)
router.post("/public/full", leadsController.createFullLead);

export const leadsRoutes = router;
