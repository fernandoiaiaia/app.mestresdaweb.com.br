import { Router } from "express";
import { sdrController } from "./sdr.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = Router();

// All SDR routes require authentication
router.use(authMiddleware);

// ═══════════════════════════════════════
// CADENCES
// ═══════════════════════════════════════
router.get("/cadences", sdrController.listCadences);
router.post("/cadences", sdrController.createCadence);
router.get("/cadences/:id", sdrController.getCadence);
router.put("/cadences/:id", sdrController.updateCadence);
router.delete("/cadences/:id", sdrController.deleteCadence);
router.patch("/cadences/:id/status", sdrController.updateCadenceStatus);

// ═══ Steps ═══
router.post("/cadences/:id/steps", sdrController.addStep);
router.put("/cadences/:id/steps/:stepId", sdrController.updateStep);
router.delete("/cadences/:id/steps/:stepId", sdrController.deleteStep);
router.put("/cadences/:id/steps/reorder", sdrController.reorderSteps);

// ═══════════════════════════════════════
// LEADS
// ═══════════════════════════════════════
router.get("/leads/available", sdrController.getAvailableLeads);
router.post("/leads/activate", sdrController.activateLeads);
router.post("/leads/import", sdrController.importLeads);
router.post("/leads/:id/pause", sdrController.pauseLead);
router.post("/leads/:id/resume", sdrController.resumeLead);
router.post("/leads/:id/remove", sdrController.removeLead);
router.post("/leads/:id/takeover", sdrController.takeoverLead);

// ═══ Timeline ═══
router.get("/leads/:id/timeline", sdrController.getLeadTimeline);
router.get("/leads/:id/qualification", sdrController.getLeadQualification);
router.post("/leads/:id/recalculate-score", sdrController.recalculateScore);
router.post("/leads/:id/override-temperature", sdrController.overrideTemperature);

// ═══════════════════════════════════════
// MONITOR
// ═══════════════════════════════════════
router.get("/monitor/stats", sdrController.getMonitorStats);
router.get("/monitor/leads", sdrController.getMonitorLeads);
router.get("/monitor/feed", sdrController.getActivityFeed);
router.get("/monitor/interventions", sdrController.getInterventions);

// ═══════════════════════════════════════
// QUALIFICATION & SCORE
// ═══════════════════════════════════════
router.get("/qualification/criteria", sdrController.listCriteria);
router.post("/qualification/criteria", sdrController.createCriteria);
router.put("/qualification/criteria/:id", sdrController.updateCriteria);
router.delete("/qualification/criteria/:id", sdrController.deleteCriteria);
router.put("/qualification/criteria/reorder", sdrController.reorderCriteria);
router.get("/qualification/thresholds", sdrController.getThresholds);
router.put("/qualification/thresholds", sdrController.updateThresholds);

// ═══════════════════════════════════════
// SCHEDULING
// ═══════════════════════════════════════
router.get("/scheduling/meetings", sdrController.listMeetings);
router.post("/scheduling/meetings", sdrController.createMeeting);
router.put("/scheduling/meetings/:id", sdrController.updateMeeting);

export const sdrRoutes: Router = router;
