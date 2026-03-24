import { Request, Response } from "express";
import { devProjectsService } from "./dev-projects.service.js";

// ═══════════════════════════════════════
// ProposalAI — Dev Projects Controller
// ═══════════════════════════════════════

class DevProjectsController {
    /** GET /api/dev-projects/stats */
    async stats(req: Request, res: Response) {
        const data = await devProjectsService.getStats(req.user!);
        res.json({ success: true, data });
    }

    /** GET /api/dev-projects */
    async list(req: Request, res: Response) {
        const projects = await devProjectsService.list(req.user!, req.query as any);
        res.json({ success: true, data: projects });
    }

    /** GET /api/dev-projects/:id */
    async getById(req: Request, res: Response) {
        const project = await devProjectsService.getById((req.params.id as string));
        if (!project) return res.status(404).json({ success: false, error: { message: "Projeto não encontrado" } });
        res.json({ success: true, data: project });
    }

    /** POST /api/dev-projects */
    async create(req: Request, res: Response) {
        const project = await devProjectsService.create(req.body, req.user!);
        res.status(201).json({ success: true, data: project });
    }

    /** POST /api/dev-projects/from-proposal/:proposalId */
    async createFromProposal(req: Request, res: Response) {
        try {
            const project = await devProjectsService.createFromProposal((req.params.proposalId as string), req.user!);
            res.status(201).json({ success: true, data: project });
        } catch (err: any) {
            res.status(400).json({ success: false, error: { message: err.message } });
        }
    }

    /** PATCH /api/dev-projects/:id */
    async update(req: Request, res: Response) {
        const project = await devProjectsService.update((req.params.id as string), req.body);
        res.json({ success: true, data: project });
    }

    /** DELETE /api/dev-projects/:id */
    async delete(req: Request, res: Response) {
        await devProjectsService.delete((req.params.id as string));
        res.json({ success: true, data: { message: "Projeto excluído" } });
    }

    // ── TASKS ──

    /** GET /api/dev-projects/:id/tasks */
    async listTasks(req: Request, res: Response) {
        const tasks = await devProjectsService.listTasks((req.params.id as string), req.query as any);
        res.json({ success: true, data: tasks });
    }

    /** GET /api/dev-projects/tasks/all (backlog) */
    async listAllTasks(req: Request, res: Response) {
        const tasks = await devProjectsService.listAllTasks(req.user!, req.query as any);
        res.json({ success: true, data: tasks });
    }

    /** POST /api/dev-projects/:id/tasks */
    async createTask(req: Request, res: Response) {
        const task = await devProjectsService.createTask((req.params.id as string), req.body);
        res.status(201).json({ success: true, data: task });
    }

    /** PATCH /api/dev-projects/tasks/:taskId */
    async updateTask(req: Request, res: Response) {
        const user = (req as any).user;
        const body = req.body;
        const task = await devProjectsService.updateTask((req.params.taskId as string), body);
        // Log history for meaningful changes
        const statusLabels: Record<string, string> = { todo: "A Fazer", in_progress: "Em Desenvolvimento", review: "Em Revisão", done: "Concluída" };
        if (body.status !== undefined) await devProjectsService.logHistory(task.id, user.userId, "status_change", `Status alterado para "${statusLabels[body.status] || body.status}"`, { status: body.status });
        if (body.priority !== undefined) await devProjectsService.logHistory(task.id, user.userId, "priority_change", `Prioridade alterada para "${body.priority}"`, { priority: body.priority });
        if (body.assigneeId !== undefined) await devProjectsService.logHistory(task.id, user.userId, "assignment", body.assigneeId ? `Tarefa atribuída a ${task.assignee?.name || "outro membro"}` : "Atribuição removida", { assigneeId: body.assigneeId });
        if (body.description !== undefined) await devProjectsService.logHistory(task.id, user.userId, "description_update", "Descrição atualizada");
        if (body.blocked !== undefined) await devProjectsService.logHistory(task.id, user.userId, "blocked_change", body.blocked ? "Tarefa marcada como bloqueada" : "Bloqueio removido");
        res.json({ success: true, data: task });
    }

    /** DELETE /api/dev-projects/tasks/:taskId */
    async deleteTask(req: Request, res: Response) {
        await devProjectsService.deleteTask((req.params.taskId as string));
        res.json({ success: true, data: { message: "Tarefa excluída" } });
    }

    // ── TEAM MEMBERS ──

    /** GET /api/dev-projects/:id/members */
    async listMembers(req: Request, res: Response) {
        const members = await devProjectsService.listMembers((req.params.id as string));
        res.json({ success: true, data: members });
    }

    /** POST /api/dev-projects/:id/members */
    async addMember(req: Request, res: Response) {
        const member = await devProjectsService.addMember((req.params.id as string), req.body.userId, req.body.role);
        res.status(201).json({ success: true, data: member });
    }

    /** DELETE /api/dev-projects/:id/members/:memberId */
    async removeMember(req: Request, res: Response) {
        await devProjectsService.removeMember((req.params.id as string), (req.params.memberId as string));
        res.json({ success: true, data: { message: "Membro removido" } });
    }

    // ── CLIENT CONTACTS ──

    /** GET /api/dev-projects/:id/contacts */
    async listContacts(req: Request, res: Response) {
        const contacts = await devProjectsService.listContacts((req.params.id as string));
        res.json({ success: true, data: contacts });
    }

    /** POST /api/dev-projects/:id/contacts */
    async addContact(req: Request, res: Response) {
        const contact = await devProjectsService.addContact((req.params.id as string), req.body);
        res.status(201).json({ success: true, data: contact });
    }

    /** DELETE /api/dev-projects/:id/contacts/:contactId */
    async removeContact(req: Request, res: Response) {
        await devProjectsService.removeContact((req.params.id as string), (req.params.contactId as string));
        res.json({ success: true, data: { message: "Contato removido" } });
    }

    // ── SIGNATORIES ──

    /** GET /api/dev-projects/:id/signatories */
    async getSignatories(req: Request, res: Response) {
        const signatories = await devProjectsService.getSignatories((req.params.id as string));
        res.json({ success: true, data: signatories });
    }

    /** PUT /api/dev-projects/:id/signatories */
    async saveSignatories(req: Request, res: Response) {
        const signatories = await devProjectsService.saveSignatories((req.params.id as string), req.body.signatories || []);
        res.json({ success: true, data: signatories });
    }

    // ── TASK COMMENTS ──

    /** GET /api/dev-projects/tasks/:taskId/comments */
    async listComments(req: Request, res: Response) {
        const comments = await devProjectsService.listComments((req.params.taskId as string));
        res.json({ success: true, data: comments });
    }

    /** POST /api/dev-projects/tasks/:taskId/comments */
    async addComment(req: Request, res: Response) {
        const user = (req as any).user;
        const comment = await devProjectsService.addComment((req.params.taskId as string), user.userId, req.body.text);
        await devProjectsService.logHistory((req.params.taskId as string), user.userId, "comment", `Comentário adicionado: "${req.body.text.substring(0, 80)}${req.body.text.length > 80 ? '...' : ''}"`);
        res.status(201).json({ success: true, data: comment });
    }

    // ── TASK TIME LOGS ──

    /** GET /api/dev-projects/tasks/:taskId/time-logs */
    async listTimeLogs(req: Request, res: Response) {
        const logs = await devProjectsService.listTimeLogs((req.params.taskId as string));
        res.json({ success: true, data: logs });
    }

    /** POST /api/dev-projects/tasks/:taskId/time-logs */
    async addTimeLog(req: Request, res: Response) {
        const user = (req as any).user;
        const log = await devProjectsService.addTimeLog((req.params.taskId as string), user.userId, req.body);
        await devProjectsService.logHistory((req.params.taskId as string), user.userId, "time_log", `${req.body.hours}h registradas${req.body.description ? ` — ${req.body.description}` : ""}`, { hours: req.body.hours });
        res.status(201).json({ success: true, data: log });
    }

    // ── TASK BUGS ──

    /** GET /api/dev-projects/tasks/:taskId/bugs */
    async listBugs(req: Request, res: Response) {
        const bugs = await devProjectsService.listBugs((req.params.taskId as string));
        res.json({ success: true, data: bugs });
    }

    /** POST /api/dev-projects/tasks/:taskId/bugs */
    async addBug(req: Request, res: Response) {
        const user = (req as any).user;
        const bug = await devProjectsService.addBug((req.params.taskId as string), user.userId, req.body);
        await devProjectsService.logHistory((req.params.taskId as string), user.userId, "bug_report", `Bug reportado: "${req.body.description.substring(0, 80)}${req.body.description.length > 80 ? '...' : ''}"`, { category: req.body.category, priority: req.body.priority });
        res.status(201).json({ success: true, data: bug });
    }

    /** PATCH /api/dev-projects/tasks/:taskId/bugs/:bugId */
    async updateBug(req: Request, res: Response) {
        const user = (req as any).user;
        const bug = await devProjectsService.updateBug((req.params.bugId as string), req.body);
        if (req.body.status === "fixed") await devProjectsService.logHistory((req.params.taskId as string), user.userId, "bug_fixed", "Bug marcado como corrigido");
        res.json({ success: true, data: bug });
    }

    // ── TASK ATTACHMENTS ──

    /** GET /api/dev-projects/tasks/:taskId/attachments */
    async listAttachments(req: Request, res: Response) {
        const attachments = await devProjectsService.listAttachments((req.params.taskId as string));
        res.json({ success: true, data: attachments });
    }

    /** POST /api/dev-projects/tasks/:taskId/attachments */
    async uploadAttachment(req: Request, res: Response) {
        console.log("[UPLOAD] Request received for task:", (req.params.taskId as string));
        console.log("[UPLOAD] File:", (req as any).file ? (req as any).file.originalname : "NO FILE");
        const file = (req as any).file;
        if (!file) {
            console.log("[UPLOAD] ERROR: No file in request");
            res.status(400).json({ success: false, error: "Nenhum arquivo enviado" });
            return;
        }
        const user = (req as any).user;
        console.log("[UPLOAD] User:", user?.userId, "Saving to DB...");
        const attachment = await devProjectsService.addAttachment((req.params.taskId as string), user.userId, {
            originalName: file.originalname,
            storedName: file.filename,
            mimeType: file.mimetype,
            size: file.size,
        });
        console.log("[UPLOAD] SUCCESS:", attachment.id);
        await devProjectsService.logHistory((req.params.taskId as string), user.userId, "attachment_upload", `Arquivo anexado: "${file.originalname}"`, { fileName: file.originalname, mimeType: file.mimetype });
        res.status(201).json({ success: true, data: attachment });
    }

    /** DELETE /api/dev-projects/tasks/:taskId/attachments/:attachmentId */
    async deleteAttachment(req: Request, res: Response) {
        const user = (req as any).user;
        const att = await devProjectsService.getAttachment((req.params.attachmentId as string));
        await devProjectsService.deleteAttachment((req.params.attachmentId as string));
        if (att) await devProjectsService.logHistory((req.params.taskId as string), user.userId, "attachment_delete", `Arquivo removido: "${att.originalName}"`);
        res.json({ success: true, message: "Arquivo excluído" });
    }

    /** GET /api/dev-projects/tasks/:taskId/attachments/:attachmentId/download */
    async downloadAttachment(req: Request, res: Response) {
        const attachment = await devProjectsService.getAttachment((req.params.attachmentId as string));
        if (!attachment) {
            res.status(404).json({ success: false, error: "Arquivo não encontrado" });
            return;
        }
        const filePath = (await import("path")).resolve(process.cwd(), "uploads", "task-attachments", attachment.storedName);
        const fs = (await import("fs"));
        if (!fs.existsSync(filePath)) {
            res.status(404).json({ success: false, error: "Arquivo físico não encontrado" });
            return;
        }
        // Use inline for images so <img> tags can render, attachment for other files
        const disposition = attachment.mimeType.startsWith("image/") ? "inline" : "attachment";
        res.setHeader("Content-Disposition", `${disposition}; filename="${encodeURIComponent(attachment.originalName)}"`);
        res.setHeader("Content-Type", attachment.mimeType);
        // Allow cross-origin access for <img> tags (frontend on different port)
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        res.setHeader("Access-Control-Allow-Origin", "*");
        fs.createReadStream(filePath).pipe(res);
    }

    // ── TASK HISTORY ──

    /** GET /api/dev-projects/tasks/:taskId/history */
    async listHistory(req: Request, res: Response) {
        const history = await devProjectsService.listHistory((req.params.taskId as string));
        res.json({ success: true, data: history });
    }

    /** GET /api/dev-projects/:id/sprints */
    async listSprints(req: Request, res: Response) {
        const sprints = await devProjectsService.listSprints((req.params.id as string));
        res.json({ success: true, data: sprints });
    }

    /** GET /api/dev-projects/sprints/all */
    async listAllSprints(req: Request, res: Response) {
        const sprints = await devProjectsService.listAllSprints(req.user!);
        res.json({ success: true, data: sprints });
    }

    // ── DOCUMENT CRUD ──

    /** GET /api/dev-projects/documents/all */
    async listDocuments(req: Request, res: Response) {
        const docType = req.query.docType as string | undefined;
        const docs = await devProjectsService.listAllDocuments(req.user!, docType);
        res.json({ success: true, data: docs });
    }

    /** GET /api/dev-projects/documents/:docId */
    async getDocument(req: Request, res: Response) {
        const doc = await devProjectsService.getDocument((req.params.docId as string));
        if (!doc) return res.status(404).json({ success: false, error: { message: "Documento não encontrado" } });
        res.json({ success: true, data: doc });
    }

    /** POST /api/dev-projects/:id/documents */
    async createDocument(req: Request, res: Response) {
        const file = (req as any).file;
        if (!file) return res.status(400).json({ success: false, error: { message: "Arquivo é obrigatório" } });

        const doc = await devProjectsService.createDocument({
            projectId: (req.params.id as string),
            docType: req.body.docType || "outros",
            title: req.body.title || file.originalname,
            fileName: file.originalname,
            storedName: file.filename,
            fileSize: file.size,
            mimeType: file.mimetype,
            notes: req.body.notes,
            uploadedById: req.user!.userId,
        });
        res.status(201).json({ success: true, data: doc });
    }

    /** PATCH /api/dev-projects/documents/:docId */
    async updateDocument(req: Request, res: Response) {
        const doc = await devProjectsService.updateDocument((req.params.docId as string), req.body);
        res.json({ success: true, data: doc });
    }

    /** DELETE /api/dev-projects/documents/:docId */
    async deleteDocument(req: Request, res: Response) {
        const doc = await devProjectsService.deleteDocument((req.params.docId as string));
        if (!doc) return res.status(404).json({ success: false, error: { message: "Documento não encontrado" } });
        res.json({ success: true, data: doc });
    }

    /** GET /api/dev-projects/documents/:docId/download */
    async downloadDocument(req: Request, res: Response) {
        const doc = await devProjectsService.getDocument((req.params.docId as string));
        if (!doc) { res.status(404).json({ success: false, error: "Documento não encontrado" }); return; }

        const path = (await import("path")).default;
        const fs = (await import("fs"));
        const filePath = path.resolve(process.cwd(), "uploads", "project-documents", doc.storedName);

        if (!fs.existsSync(filePath)) {
            res.status(404).json({ success: false, error: "Arquivo físico não encontrado" });
            return;
        }

        const disposition = doc.mimeType.startsWith("image/") ? "inline" : "attachment";
        res.setHeader("Content-Disposition", `${disposition}; filename="${encodeURIComponent(doc.fileName)}"`);
        res.setHeader("Content-Type", doc.mimeType);
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        res.setHeader("Access-Control-Allow-Origin", "*");
        fs.createReadStream(filePath).pipe(res);
    }
}

export const devProjectsController = new DevProjectsController();

