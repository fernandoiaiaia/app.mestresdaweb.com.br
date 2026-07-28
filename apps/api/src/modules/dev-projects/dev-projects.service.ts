import { prisma } from "../../config/database.js";

// ═══════════════════════════════════════
// ProposalAI — Dev Projects Service
// ═══════════════════════════════════════

interface JwtUser {
    userId: string;
    role: string;
}

class DevProjectsService {
    // ── HELPER: get user's dataScope for a module ──
    private async getUserDataScope(userId: string, module: string, action: string): Promise<"OWN" | "ALL"> {
        const perm = await prisma.permission.findFirst({
            where: { userId, module, action },
            select: { dataScope: true },
        });
        return perm?.dataScope === "ALL" ? "ALL" : "OWN";
    }

    // ── HELPER: get project IDs where user is a member ──
    private async getUserProjectIds(userId: string): Promise<string[]> {
        const memberships = await prisma.devProjectMember.findMany({
            where: { userId },
            select: { projectId: true },
        });
        // Also include projects the user created
        const ownedProjects = await prisma.devProject.findMany({
            where: { createdById: userId },
            select: { id: true },
        });

        // Try to match the logged in user's email to CRM Client records
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true }
        });
        let clientIds: string[] = [];
        if (user?.email) {
            const matchedClients = await prisma.client.findMany({
                where: { email: user.email },
                select: { id: true }
            });
            clientIds = matchedClients.map(c => c.id);
        }

        // Include projects where user is the Client (Viewer of the Proposal)
        const viewerProjects = await prisma.devProject.findMany({
            where: { 
                proposal: { 
                    OR: [
                        { viewerId: userId },
                        ...(clientIds.length > 0 ? [{ clientId: { in: clientIds } }] : [])
                    ]
                } 
            },
            select: { id: true },
        });
        // Include projects where user is the Client (Viewer of the Assembled Proposal)
        const assembledViewerProjects = await prisma.devProject.findMany({
            where: { 
                assembledProposal: { 
                    OR: [
                        { viewerId: userId },
                        ...(clientIds.length > 0 ? [{ clientId: { in: clientIds } }] : [])
                    ]
                } 
            },
            select: { id: true },
        });
        const ids = new Set([
            ...memberships.map(m => m.projectId),
            ...ownedProjects.map(p => p.id),
            ...viewerProjects.map(p => p.id),
            ...assembledViewerProjects.map(p => p.id),
        ]);
        return Array.from(ids);
    }

    // ── LIST ALL PROJECTS ──
    async list(user: JwtUser, query: { search?: string; health?: string; phase?: string; archived?: string }) {
        const where: any = {};
        if (query.archived === "true") { where.archived = true; } else { where.archived = false; }
        if (query.health) where.health = query.health;
        if (query.phase) where.phase = query.phase;
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: "insensitive" } },
                { client: { contains: query.search, mode: "insensitive" } },
            ];
        }

        // DataScope filter: OWNER/ADMIN see all, others depend on permission
        if (user.role !== "OWNER" && user.role !== "ADMIN") {
            const scope = await this.getUserDataScope(user.userId, "projects", "view");
            if (scope === "OWN") {
                const projectIds = await this.getUserProjectIds(user.userId);
                where.id = { in: projectIds };
            }
        }

        const projects = await prisma.devProject.findMany({
            where,
            include: {
                tasks: { select: { id: true, status: true } },
                createdBy: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return projects.map((p: any) => ({
            ...p,
            tasksTotal: p.tasks.length,
            tasksDone: p.tasks.filter((t: any) => t.status === "done").length,
            tasks: undefined,
        }));
    }

    // ── GET PROJECT BY ID ──
    async getById(id: string) {
        return prisma.devProject.findUnique({
            where: { id },
            include: {
                tasks: {
                    include: { assignee: { select: { id: true, name: true, avatar: true, position: true } } },
                    orderBy: { createdAt: "asc" },
                },
                createdBy: { select: { id: true, name: true } },
                // proposal: { select: { id: true, title: true, scopeRaw: true } },
                members: {
                    include: { user: { select: { id: true, name: true, avatar: true, role: true, position: true } } },
                    orderBy: { createdAt: "asc" },
                },
                contacts: { orderBy: { createdAt: "asc" } },
                signatories: { orderBy: { createdAt: "asc" } },
                sprints: {
                    include: { tasks: { select: { id: true, status: true } } },
                    orderBy: { sortOrder: "asc" },
                },
                documents: {
                    select: { id: true, docType: true, title: true, status: true, createdAt: true },
                    orderBy: { createdAt: "desc" },
                },
            },
        });
    }

    // ── CREATE FROM PROPOSAL (Enviar para Devs) ──
    async createFromProposal(proposalId: string, user: JwtUser) {
        const existingBase = await prisma.devProject.findUnique({ where: { proposalId } });
        if (existingBase) throw new Error("Um projeto já foi criado para esta proposta.");

        const proposal = await prisma.proposal.findUnique({ where: { id: proposalId }, include: { client: true } });
        if (!proposal) throw new Error("Proposta não encontrada");

        const tasks: { title: string; description: string; epic: string; tags: string[]; estimatedHours: number }[] = [];

        const lines = (proposal.scopeRaw || "").split('\n').filter(l => l.trim().length > 0);
        let curPlatform = null;
        let curUser = null;
        let curModule = null;
        let curScreen = null;
        
        for (const l of lines) {
            if (l.startsWith("1. Plataforma:")) {
                curPlatform = l.replace('1. Plataforma:', '').trim();
            } else if (l.startsWith("Usuário:")) {
                curUser = l.replace('Usuário:', '').trim();
            } else if (l.startsWith("Módulo:")) {
                curModule = l.replace('Módulo:', '').trim();
            } else if (l.startsWith("Tela:")) {
                curScreen = l.replace('Tela:', '').trim();
            } else if (l.startsWith("Funcionalidade:")) {
                const fName = l.replace('Funcionalidade:', '').trim();
                const epicName = `${curPlatform || "Geral"} - ${curModule || "Geral"}`.substring(0, 50);
                tasks.push({
                    title: `${curScreen || "Tela"}: ${fName}`,
                    description: "Auto-generated description",
                    epic: epicName,
                    estimatedHours: 8,
                    tags: []
                });
            } else if (l.startsWith("Descrição:")) {
                if (tasks.length > 0) {
                    tasks[tasks.length - 1].description = l.replace('Descrição:', '').trim();
                }
            }
        }
        
        // Calculate total estimated hours
        const totalHours = tasks.reduce((sum, t) => sum + t.estimatedHours, 0);

        // Determine deadline (30 days from now if none on estimate)
        const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        // Create project with tasks
        const project = await prisma.devProject.create({
            data: {
                name: proposal.title,
                client: (proposal as any).client?.name || "Cliente Integrado",
                proposalId: proposal.id,
                createdById: user.userId,
                startDate: new Date(),
                deadline,
                hoursEstimated: totalHours,
                tasks: {
                    create: tasks.map(t => ({
                        title: t.title,
                        description: t.description,
                        epic: t.epic,
                        tags: t.tags,
                        estimatedHours: t.estimatedHours,
                    })),
                },
            },
            include: { tasks: true },
        });

        return project;
    }

    // ── CREATE FROM ASSEMBLED PROPOSAL (Assembler IA → Web Dev) ──
    async createFromAssembledProposal(assembledProposalId: string, user: JwtUser) {
        // 1. Fetch the assembled proposal
        const assembled = await prisma.assembledProposal.findUnique({
            where: { id: assembledProposalId },
            include: { client: true },
        });
        if (!assembled) throw new Error("Proposta Assembler não encontrada.");

        // 2. Derive project name, then check duplicate
        const projectName = assembled.title || "Projeto Assembler";
        const existing = await prisma.devProject.findFirst({
            where: { name: projectName, createdById: user.userId },
        });
        if (existing) throw new Error("Um projeto já foi criado para esta proposta.");

        // 3. Parse the scopeData JSON and build tasks (One DevTask per Screen)
        let scope = assembled.scopeData as any;
        
        // [BUGFIX] Fallback for 'double-nesting' bug where scopeData was saved as { scopeData: { ... } }
        if (scope && scope.scopeData && !scope.users) {
            console.log(`[DevProjectsService] Detected nested scopeData for proposal ${assembledProposalId}. Flattening...`);
            scope = scope.scopeData;
        }

        console.log(`[DevProjectsService] Generating tasks for project "${projectName}" from assembled proposal.`);
        const taskList: { title: string; description: string; epic: string; story: string; tags: string[]; estimatedHours: number }[] = [];

        const users: any[] = scope?.users || [];
        for (const userNode of users) {
            const userName: string = userNode.userName || "Usuário Geral";
            for (const platform of (userNode.platforms || [])) {
                const platformName: string = platform.platformName || "Plataforma Indefinida";
                for (const mod of (platform.modules || [])) {
                    const modName: string = mod.title || "Módulo Indefinido";
                    
                    for (const screen of (mod.screens || [])) {
                        const screenTitle: string = screen.title || "Tela Sem Nome";
                        
                        let screenHours = 0;
                        const functionalities = [];
                        
                        for (const func of (screen.functionalities || [])) {
                            const hours = typeof func.estimatedHours === "number" ? func.estimatedHours : 4;
                            screenHours += hours;
                            functionalities.push({
                                id: Math.random().toString(36).substring(2, 11),
                                title: func.title || "Funcionalidade",
                                description: func.description || "",
                                estimatedHours: hours,
                                done: false
                            });
                        }

                        taskList.push({
                            title: screenTitle,
                            description: screen.description || `Esta tela agrupa ${functionalities.length} funcionalidades.`,
                            story: JSON.stringify(functionalities),
                            epic: modName.substring(0, 50),
                            estimatedHours: screenHours,
                            tags: [`user:${userName}`, `platform:${platformName}`],
                        });
                    }
                }
            }
        }

        console.log(`[DevProjectsService] Created ${taskList.length} tasks ready for insertion.`);

        const totalHours = taskList.reduce((sum, t) => sum + t.estimatedHours, 0);
        const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const clientName = (assembled as any).client?.name || scope?.users?.[0]?.userName || "Cliente";

        // 4. Create the project (no proposalId — FK only covers CRM proposals)
        const project = await prisma.devProject.create({
            data: {
                name: projectName,
                client: clientName,
                assembledProposalId: assembledProposalId,
                createdById: user.userId,
                startDate: new Date(),
                deadline,
                hoursEstimated: totalHours,
                tasks: {
                    create: taskList.map(t => ({
                        title: t.title,
                        description: t.description,
                        story: t.story,
                        epic: t.epic,
                        tags: t.tags,
                        estimatedHours: t.estimatedHours,
                    })),
                },
            },
            include: { tasks: true },
        });

        return project;
    }

    // ── CREATE PROJECT MANUALLY ──
    async create(data: { name: string; client: string; deadline?: string }, user: JwtUser) {
        return prisma.devProject.create({
            data: {
                name: data.name,
                client: data.client,
                createdById: user.userId,
                startDate: new Date(),
                deadline: data.deadline ? new Date(data.deadline) : null,
            },
        });
    }

    // ── UPDATE PROJECT ──
    async update(id: string, data: any) {
        const { phase, health, progress, archived, deadline, name, client } = data;
        return prisma.devProject.update({
            where: { id },
            data: {
                ...(phase !== undefined && { phase }),
                ...(health !== undefined && { health }),
                ...(progress !== undefined && { progress }),
                ...(archived !== undefined && { archived }),
                ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
                ...(name !== undefined && { name }),
                ...(client !== undefined && { client }),
            },
        });
    }

    // ── DELETE PROJECT ──
    async delete(id: string) {
        return prisma.devProject.delete({ where: { id } });
    }

    // ── LIST TASKS FOR A PROJECT ──
    async listTasks(projectId: string, query: { status?: string; priority?: string; assigneeId?: string; search?: string }) {
        const where: any = { projectId };
        if (query.status) where.status = query.status;
        if (query.priority) where.priority = query.priority;
        if (query.assigneeId) where.assigneeId = query.assigneeId;
        if (query.search) {
            where.OR = [
                { title: { contains: query.search, mode: "insensitive" } },
                { epic: { contains: query.search, mode: "insensitive" } },
            ];
        }

        return prisma.devTask.findMany({
            where,
            include: {
                assignee: { select: { id: true, name: true, avatar: true, position: true } },
                project: { select: { id: true, name: true, client: true } },
            },
            orderBy: { createdAt: "asc" },
        });
    }

    // ── LIST ALL TASKS (BACKLOG) ──
    async listAllTasks(user: JwtUser, query: { status?: string; priority?: string; projectId?: string; assigneeId?: string; search?: string }) {
        const where: any = {};
        if (query.status) where.status = query.status;
        if (query.priority) where.priority = query.priority;
        if (query.projectId) where.projectId = query.projectId;
        if (query.assigneeId) where.assigneeId = query.assigneeId;
        if (query.search) {
            where.OR = [
                { title: { contains: query.search, mode: "insensitive" } },
                { epic: { contains: query.search, mode: "insensitive" } },
            ];
        }

        // DataScope filter: OWNER/ADMIN see all, others depend on permission
        if (user.role !== "OWNER" && user.role !== "ADMIN") {
            const scope = await this.getUserDataScope(user.userId, "backlog", "view");
            if (scope === "OWN") {
                const projectIds = await this.getUserProjectIds(user.userId);
                where.projectId = query.projectId
                    ? (projectIds.includes(query.projectId) ? query.projectId : "__none__")
                    : { in: projectIds };
            }
        }

        return prisma.devTask.findMany({
            where,
            include: {
                assignee: { select: { id: true, name: true, avatar: true, position: true } },
                project: { select: { id: true, name: true, client: true } },
            },
            orderBy: { createdAt: "asc" },
        });
    }

    // ── CREATE TASK ──
    async createTask(projectId: string, data: any) {
        // Recalculate project progress after adding task
        const task = await prisma.devTask.create({
            data: {
                projectId,
                title: data.title,
                description: data.description || null,
                epic: data.epic || null,
                story: data.story || null,
                priority: data.priority || "medium",
                tags: data.tags || [],
                estimatedHours: data.estimatedHours || 0,
                deadline: data.deadline ? new Date(data.deadline) : null,
                assigneeId: data.assigneeId || null,
            },
            include: {
                assignee: { select: { id: true, name: true, avatar: true, position: true } },
                project: { select: { id: true, name: true, client: true } },
            },
        });

        await this.recalculateProjectProgress(projectId);
        return task;
    }

    // ── UPDATE TASK ──
    async updateTask(taskId: string, data: any) {
        const task = await prisma.devTask.update({
            where: { id: taskId },
            data: {
                ...(data.title !== undefined && { title: data.title }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.status !== undefined && { status: data.status }),
                ...(data.priority !== undefined && { priority: data.priority }),
                ...(data.epic !== undefined && { epic: data.epic }),
                ...(data.story !== undefined && { story: data.story }),
                ...(data.tags !== undefined && { tags: data.tags }),
                ...(data.blocked !== undefined && { blocked: data.blocked }),
                ...(data.estimatedHours !== undefined && { estimatedHours: data.estimatedHours }),
                ...(data.loggedHours !== undefined && { loggedHours: data.loggedHours }),
                ...(data.deadline !== undefined && { deadline: data.deadline ? new Date(data.deadline) : null }),
                ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId || null }),
            },
            include: {
                assignee: { select: { id: true, name: true, avatar: true, position: true } },
                project: { select: { id: true, name: true, client: true } },
            },
        });

        await this.recalculateProjectProgress(task.projectId);
        return task;
    }

    // ── DELETE TASK ──
    async deleteTask(taskId: string) {
        const task = await prisma.devTask.delete({ where: { id: taskId } });
        await this.recalculateProjectProgress(task.projectId);
        return task;
    }

    // ══════════════════════════════
    // TEAM MEMBERS
    // ══════════════════════════════

    async listMembers(projectId: string) {
        return prisma.devProjectMember.findMany({
            where: { projectId },
            include: { user: { select: { id: true, name: true, avatar: true, role: true, position: true } } },
            orderBy: { createdAt: "asc" },
        });
    }

    async addMember(projectId: string, userId: string, role: string = "DEV") {
        return prisma.devProjectMember.upsert({
            where: { projectId_userId: { projectId, userId } },
            update: { role },
            create: { projectId, userId, role },
            include: { user: { select: { id: true, name: true, avatar: true, role: true, position: true } } },
        });
    }

    async removeMember(projectId: string, memberId: string) {
        return prisma.devProjectMember.delete({ where: { id: memberId, projectId } });
    }

    // ══════════════════════════════
    // CLIENT CONTACTS
    // ══════════════════════════════

    async listContacts(projectId: string) {
        return prisma.devProjectContact.findMany({
            where: { projectId },
            orderBy: { createdAt: "asc" },
        });
    }

    async addContact(projectId: string, data: { name: string; email?: string; phone?: string }) {
        return prisma.devProjectContact.create({
            data: { projectId, name: data.name, email: data.email || null, phone: data.phone || null },
        });
    }

    async removeContact(projectId: string, contactId: string) {
        return prisma.devProjectContact.delete({ where: { id: contactId, projectId } });
    }

    // ══════════════════════════════
    // SIGNATORIES
    // ══════════════════════════════

    async getSignatories(projectId: string) {
        return prisma.devProjectSignatory.findMany({
            where: { projectId },
            orderBy: { createdAt: "asc" },
        });
    }

    async saveSignatories(projectId: string, signatories: { role: string; source: string; sourceId: string; name: string }[]) {
        // Delete existing and recreate (bulk upsert)
        await prisma.devProjectSignatory.deleteMany({ where: { projectId } });
        if (signatories.length === 0) return [];

        await prisma.devProjectSignatory.createMany({
            data: signatories.map(s => ({
                projectId,
                role: s.role,
                source: s.source,
                sourceId: s.sourceId,
                name: s.name,
            })),
        });

        return prisma.devProjectSignatory.findMany({
            where: { projectId },
            orderBy: { createdAt: "asc" },
        });
    }

    // ══════════════════════════════
    // TASK COMMENTS
    // ══════════════════════════════

    async listProjectRecentComments(projectId: string) {
        return prisma.devTaskComment.findMany({
            where: { 
                task: { projectId },
                // @ts-ignore - isRead is valid but IDE might have stale generated client
                isRead: false 
            },
            include: {
                task: { select: { id: true, title: true } },
                user: { select: { id: true, name: true, avatar: true, role: true } }
            },
            orderBy: { createdAt: "desc" },
            take: 30
        });
    }

    async markCommentAsRead(commentId: string) {
        return prisma.devTaskComment.update({
            where: { id: commentId },
            // @ts-ignore - isRead is valid but IDE might have stale generated client
            data: { isRead: true }
        });
    }

    async markAllTaskCommentsAsRead(taskId: string) {
        return prisma.devTaskComment.updateMany({
            // @ts-ignore - isRead is valid but IDE might have stale generated client
            where: { taskId, isRead: false },
            // @ts-ignore - isRead is valid but IDE might have stale generated client
            data: { isRead: true }
        });
    }

    async listComments(taskId: string) {
        return prisma.devTaskComment.findMany({
            where: { taskId },
            include: { user: { select: { id: true, name: true, avatar: true } } },
            orderBy: { createdAt: "asc" },
        });
    }

    async addComment(taskId: string, userId: string, text: string) {
        return prisma.devTaskComment.create({
            data: { taskId, userId, text },
            include: { user: { select: { id: true, name: true, avatar: true } } },
        });
    }

    // ══════════════════════════════
    // TASK TIME LOGS
    // ══════════════════════════════

    async listTimeLogs(taskId: string) {
        return prisma.devTaskTimeLog.findMany({
            where: { taskId },
            include: { user: { select: { id: true, name: true } } },
            orderBy: { date: "desc" },
        });
    }

    async addTimeLog(taskId: string, userId: string, data: { hours: number; description?: string; date?: string }) {
        const log = await prisma.devTaskTimeLog.create({
            data: {
                taskId,
                userId,
                hours: data.hours,
                description: data.description || null,
                date: data.date ? new Date(data.date) : new Date(),
            },
            include: { user: { select: { id: true, name: true } } },
        });

        // Update loggedHours on the task
        const totalLogs = await prisma.devTaskTimeLog.aggregate({
            where: { taskId },
            _sum: { hours: true },
        });
        await prisma.devTask.update({
            where: { id: taskId },
            data: { loggedHours: totalLogs._sum.hours || 0 },
        });

        return log;
    }

    // ══════════════════════════════
    // TASK BUGS
    // ══════════════════════════════

    async listBugs(taskId: string) {
        return prisma.devTaskBug.findMany({
            where: { taskId },
            include: {
                reporter: { select: { id: true, name: true } },
                assignee: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    async addBug(taskId: string, reporterId: string, data: {
        description: string;
        category?: string;
        priority?: string;
        assigneeId?: string;
        attachmentIds?: string[];
    }) {
        return prisma.devTaskBug.create({
            data: {
                taskId,
                reporterId,
                description: data.description,
                category: data.category || "functional",
                priority: data.priority || "high",
                assigneeId: data.assigneeId || null,
                attachmentIds: data.attachmentIds || [],
            },
            include: {
                reporter: { select: { id: true, name: true } },
                assignee: { select: { id: true, name: true } },
            },
        });
    }

    async updateBug(bugId: string, data: { status?: string; hoursWorked?: number }) {
        return prisma.devTaskBug.update({
            where: { id: bugId },
            data: {
                ...(data.status !== undefined && { status: data.status }),
                ...(data.hoursWorked !== undefined && { hoursWorked: data.hoursWorked }),
            },
            include: {
                reporter: { select: { id: true, name: true } },
                assignee: { select: { id: true, name: true } },
            },
        });
    }

    // ══════════════════════════════
    // TASK ATTACHMENTS
    // ══════════════════════════════

    async listAttachments(taskId: string) {
        return prisma.devTaskAttachment.findMany({
            where: { taskId },
            select: { id: true, originalName: true, mimeType: true, size: true, createdAt: true },
            orderBy: { createdAt: "desc" },
        });
    }

    async addAttachment(taskId: string, userId: string, data: {
        originalName: string; storedName: string; mimeType: string; size: number;
    }) {
        return prisma.devTaskAttachment.create({
            data: { taskId, userId, ...data },
            select: { id: true, originalName: true, mimeType: true, size: true, createdAt: true },
        });
    }

    async getAttachment(attachmentId: string) {
        return prisma.devTaskAttachment.findUnique({ where: { id: attachmentId } });
    }

    async deleteAttachment(attachmentId: string) {
        const att = await prisma.devTaskAttachment.findUnique({ where: { id: attachmentId } });
        if (att) {
            const { resolve } = await import("path");
            const { unlinkSync, existsSync } = await import("fs");
            const filePath = resolve(process.cwd(), "uploads", "task-attachments", att.storedName);
            if (existsSync(filePath)) try { unlinkSync(filePath); } catch { }
            await prisma.devTaskAttachment.delete({ where: { id: attachmentId } });
        }
    }

    // ── RECALCULATE PROJECT PROGRESS ──
    private async recalculateProjectProgress(projectId: string) {
        const tasks = await prisma.devTask.findMany({ where: { projectId }, select: { status: true } });
        const total = tasks.length;
        const done = tasks.filter(t => t.status === "done").length;
        const progress = total > 0 ? Math.round((done / total) * 100) : 0;

        await prisma.devProject.update({
            where: { id: projectId },
            data: { progress },
        });
    }

    // ── DASHBOARD STATS ──
    async getStats(user: JwtUser) {
        const whereProject: any = { archived: false };
        // DataScope filter: OWNER/ADMIN see all, others depend on permission
        if (user.role !== "OWNER" && user.role !== "ADMIN") {
            const scope = await this.getUserDataScope(user.userId, "projects", "view");
            if (scope === "OWN") {
                const projectIds = await this.getUserProjectIds(user.userId);
                whereProject.id = { in: projectIds };
            }
        }

        const projects = await prisma.devProject.findMany({
            where: whereProject,
            select: { id: true, phase: true },
        });
        const projectIds = projects.map(p => p.id);
        const activeProjects = projects.filter(p => p.phase !== "delivery").length;

        const tasks = await prisma.devTask.findMany({
            where: { projectId: { in: projectIds } },
            select: { status: true, blocked: true },
        });

        const tasksInProgress = tasks.filter(t => t.status === "in_progress").length;
        const tasksDone = tasks.filter(t => t.status === "done").length;
        const tasksTodo = tasks.filter(t => t.status === "todo").length;
        const tasksBlocked = tasks.filter(t => t.blocked).length;

        const completedSprints = await prisma.devSprint.count({
            where: { projectId: { in: projectIds }, status: "completed" },
        });

        const pendingDocs = await prisma.devProjectDocument.count({
            where: { projectId: { in: projectIds }, status: "draft" },
        });

        return {
            activeProjects,
            totalTasks: tasks.length,
            tasksInProgress,
            tasksDone,
            tasksTodo,
            tasksBlocked,
            totalDeliveries: completedSprints,
            pendingDocuments: pendingDocs,
        };
    }

    // ── LIST SPRINTS ──
    async listSprints(projectId: string) {
        return prisma.devSprint.findMany({
            where: { projectId },
            include: { tasks: { select: { id: true, status: true } } },
            orderBy: { sortOrder: "asc" },
        });
    }

    /** List all sprints across all accessible projects */
    async listAllSprints(user: JwtUser) {
        const whereProject: any = { archived: false };
        // DataScope filter: OWNER/ADMIN see all, others depend on permission
        if (user.role !== "OWNER" && user.role !== "ADMIN") {
            const scope = await this.getUserDataScope(user.userId, "projects", "view");
            if (scope === "OWN") {
                const projectIds = await this.getUserProjectIds(user.userId);
                whereProject.id = { in: projectIds };
            }
        }

        const projects = await prisma.devProject.findMany({
            where: whereProject,
            select: { id: true },
        });
        const projectIds = projects.map(p => p.id);

        return prisma.devSprint.findMany({
            where: { projectId: { in: projectIds } },
            include: {
                tasks: { select: { id: true, status: true } },
                project: { select: { id: true, name: true, client: true } },
            },
            orderBy: [{ status: "asc" }, { endDate: "desc" }, { sortOrder: "asc" }],
        });
    }

    // ══════════════════════════════
    // TASK HISTORY (Activity Log)
    // ══════════════════════════════

    async logHistory(taskId: string, userId: string, action: string, description: string, metadata?: any) {
        return prisma.devTaskHistory.create({
            data: { taskId, userId, action, description, metadata: metadata || undefined },
        }).catch(() => { /* non-critical — don't break main flow */ });
    }

    async listHistory(taskId: string) {
        return prisma.devTaskHistory.findMany({
            where: { taskId },
            include: { user: { select: { id: true, name: true, avatar: true } } },
            orderBy: { createdAt: "desc" },
        });
    }

    // ══════════════════════════════
    // DOCUMENT CRUD
    // ══════════════════════════════

    /** List all documents, optionally filtered by docType */
    async listAllDocuments(user: JwtUser, docType?: string) {
        const whereProject: any = { archived: false };
        if (user.role !== "OWNER" && user.role !== "ADMIN") {
            const scope = await this.getUserDataScope(user.userId, "projects", "view");
            if (scope === "OWN") {
                const projectIds = await this.getUserProjectIds(user.userId);
                whereProject.id = { in: projectIds };
            }
        }

        const projects = await prisma.devProject.findMany({
            where: whereProject,
            select: { id: true },
        });
        const projectIds = projects.map(p => p.id);

        const where: any = { projectId: { in: projectIds } };
        if (docType) where.docType = docType;

        return prisma.devProjectDocument.findMany({
            where,
            include: {
                uploadedBy: { select: { id: true, name: true } },
                signatures: { select: { id: true, name: true, role: true, status: true, signedAt: true } },
                project: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    /** Get a single document by ID with signatures */
    async getDocument(id: string) {
        return prisma.devProjectDocument.findUnique({
            where: { id },
            include: {
                uploadedBy: { select: { id: true, name: true } },
                signatures: { include: { signatory: { select: { id: true, name: true, role: true } } } },
                project: { select: { id: true, name: true, client: true } },
            },
        });
    }

    /** Create a new document record (file already saved by multer) */
    async createDocument(data: {
        projectId: string;
        docType: string;
        title: string;
        fileName: string;
        storedName: string;
        fileSize: number;
        mimeType: string;
        notes?: string;
        uploadedById: string;
    }) {
        return prisma.devProjectDocument.create({
            data: {
                projectId: data.projectId,
                docType: data.docType,
                title: data.title,
                fileName: data.fileName,
                storedName: data.storedName,
                fileSize: data.fileSize,
                mimeType: data.mimeType || "application/pdf",
                notes: data.notes,
                uploadedById: data.uploadedById,
                status: "draft",
            },
            include: {
                uploadedBy: { select: { id: true, name: true } },
                project: { select: { id: true, name: true } },
            },
        });
    }

    /** Update document metadata (status, notes, title) */
    async updateDocument(id: string, data: { status?: string; notes?: string; title?: string }) {
        return prisma.devProjectDocument.update({
            where: { id },
            data,
            include: {
                uploadedBy: { select: { id: true, name: true } },
                signatures: { select: { id: true, name: true, role: true, status: true, signedAt: true } },
            },
        });
    }

    /** Delete a document and its file from disk */
    async deleteDocument(id: string) {
        const doc = await prisma.devProjectDocument.findUnique({ where: { id } });
        if (!doc) return null;

        // Delete file from disk
        try {
            const path = await import("path");
            const fs = await import("fs");
            const filePath = path.default.resolve(process.cwd(), "uploads", "project-documents", doc.storedName);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch { /* non-critical */ }

        return prisma.devProjectDocument.delete({ where: { id } });
    }
}

export const devProjectsService = new DevProjectsService();

