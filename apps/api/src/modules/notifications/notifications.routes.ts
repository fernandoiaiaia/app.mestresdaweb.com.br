import { Router } from "express";
import { notificationsController } from "./notifications.controller.js";
import { notificationFeedController } from "./notification-feed.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { upsertNotificationSettingsSchema, bulkUpsertPreferencesSchema } from "./notifications.schemas.js";

const router: Router = Router();
router.use(authMiddleware);

// ═══ Feed (actual notifications) ═══
router.get("/feed", notificationFeedController.list);
router.get("/feed/unread-count", notificationFeedController.unreadCount);
router.patch("/feed/read-all", notificationFeedController.markAllAsRead);
router.patch("/feed/:id/read", notificationFeedController.markAsRead);
router.delete("/feed/clear", notificationFeedController.deleteAll);
router.delete("/feed/:id", notificationFeedController.delete);

// ═══ Global settings ═══
router.get("/settings", notificationsController.getSettings);
router.put("/settings", validate({ body: upsertNotificationSettingsSchema }), notificationsController.upsertSettings);

// ═══ Per-event preferences ═══
router.get("/preferences", notificationsController.getPreferences);
router.put("/preferences", validate({ body: bulkUpsertPreferencesSchema }), notificationsController.bulkUpsertPreferences);

export const notificationsSettingsRoutes = router;
