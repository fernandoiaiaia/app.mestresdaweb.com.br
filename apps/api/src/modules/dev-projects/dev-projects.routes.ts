import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { devProjectsController } from "./dev-projects.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { createSafeFileFilter } from "../../lib/file-filter.js";

// ═══════════════════════════════════════
// ProposalAI — Dev Projects Routes
// ═══════════════════════════════════════

// ── Multer for task attachments ──
const uploadsDir = path.resolve(process.cwd(), "uploads", "task-attachments");
fs.mkdirSync(uploadsDir, { recursive: true });
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
        const unique = crypto.randomUUID();
        const ext = path.extname(file.originalname);
        cb(null, `${unique}${ext}`);
    },
});
const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: createSafeFileFilter()
});

// ── Multer for project documents ──
const docsDir = path.resolve(process.cwd(), "uploads", "project-documents");
fs.mkdirSync(docsDir, { recursive: true });
const docStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, docsDir),
    filename: (_req, file, cb) => {
        const unique = crypto.randomUUID();
        const ext = path.extname(file.originalname);
        cb(null, `${unique}${ext}`);
    },
});
const uploadDoc = multer({
    storage: docStorage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    fileFilter: createSafeFileFilter()
});

const router: Router = Router();

// ── Public routes (no auth needed — for <img> tags and direct file access) ──
router.get("/tasks/:taskId/attachments/:attachmentId/download", devProjectsController.downloadAttachment);
router.get("/documents/:docId/download", devProjectsController.downloadDocument);

router.use(authMiddleware);

// ── Document-specific routes (MUST be before /:id catch-all) ──
router.get("/documents/all", devProjectsController.listDocuments);
router.get("/documents/:docId", devProjectsController.getDocument);
router.patch("/documents/:docId", devProjectsController.updateDocument);
router.delete("/documents/:docId", devProjectsController.deleteDocument);

// ── Sprint routes ──
router.get("/sprints/all", devProjectsController.listAllSprints);

// ── Task-specific routes (MUST be before /:id catch-all) ──
router.get("/tasks/all", devProjectsController.listAllTasks);
router.patch("/tasks/:taskId/comments/read", devProjectsController.markAllTaskCommentsAsRead);
router.patch("/tasks/comments/:id/read", devProjectsController.markCommentAsRead);
router.patch("/tasks/:taskId", devProjectsController.updateTask);
router.delete("/tasks/:taskId", devProjectsController.deleteTask);
router.get("/tasks/:taskId/comments", devProjectsController.listComments);
router.post("/tasks/:taskId/comments", devProjectsController.addComment);
router.get("/tasks/:taskId/time-logs", devProjectsController.listTimeLogs);
router.post("/tasks/:taskId/time-logs", devProjectsController.addTimeLog);
router.get("/tasks/:taskId/bugs", devProjectsController.listBugs);
router.post("/tasks/:taskId/bugs", devProjectsController.addBug);
router.patch("/tasks/:taskId/bugs/:bugId", devProjectsController.updateBug);
router.get("/tasks/:taskId/history", devProjectsController.listHistory);

// ── Task Attachments ──
router.get("/tasks/:taskId/attachments", devProjectsController.listAttachments);
router.post("/tasks/:taskId/attachments", upload.single("file"), devProjectsController.uploadAttachment);
router.delete("/tasks/:taskId/attachments/:attachmentId", devProjectsController.deleteAttachment);
router.get("/tasks/:taskId/attachments/:attachmentId/download", devProjectsController.downloadAttachment);

// ── Project CRUD ──
router.get("/stats", devProjectsController.stats);
router.get("/", devProjectsController.list);
router.get("/:id", devProjectsController.getById);
router.get("/:id/recent-comments", devProjectsController.listProjectRecentComments);
router.post("/", devProjectsController.create);
router.post("/from-proposal/:proposalId", devProjectsController.createFromProposal);
router.post("/from-assembled/:proposalId", devProjectsController.createFromAssembledProposal);
router.patch("/:id", devProjectsController.update);
router.delete("/:id", devProjectsController.delete);

// ── Task CRUD ──
router.get("/:id/tasks", devProjectsController.listTasks);
router.post("/:id/tasks", devProjectsController.createTask);

// ── Document Upload (per project) ──
router.post("/:id/documents", uploadDoc.single("file"), devProjectsController.createDocument);

// ── Sprints ──
router.get("/:id/sprints", devProjectsController.listSprints);

// ── Team Members ──
router.get("/:id/members", devProjectsController.listMembers);
router.post("/:id/members", devProjectsController.addMember);
router.delete("/:id/members/:memberId", devProjectsController.removeMember);

// ── Client Contacts ──
router.get("/:id/contacts", devProjectsController.listContacts);
router.post("/:id/contacts", devProjectsController.addContact);
router.delete("/:id/contacts/:contactId", devProjectsController.removeContact);

// ── Signatories ──
router.get("/:id/signatories", devProjectsController.getSignatories);
router.put("/:id/signatories", devProjectsController.saveSignatories);

export const devProjectsRoutes = router;
