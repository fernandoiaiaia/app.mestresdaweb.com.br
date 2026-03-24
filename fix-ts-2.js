const fs = require('fs');
const path = require('path');

const filesToProcess = [
    'apps/api/src/modules/dev-documents/dev-documents.controller.ts',
    'apps/api/src/modules/leads/leads.controller.ts',
    'apps/api/src/modules/notifications/notification-feed.service.ts'
];

for (const file of filesToProcess) {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        content = content.replace(/req\.params\.([a-zA-Z0-9_]+)/g, '(req.params.$1 as string)');
        fs.writeFileSync(fullPath, content);
        console.log("Patched " + file);
    }
}

const authPath = path.join(process.cwd(), 'apps/api/src/middlewares/auth.middleware.ts');
if (fs.existsSync(authPath)) {
    let content = fs.readFileSync(authPath, 'utf8');
    content = content.replace(/req\.user = decoded;/g, 'req.user = { userId: decoded.userId, role: decoded.role || "USER" };');
    fs.writeFileSync(authPath, content);
    console.log("Patched auth.middleware.ts");
}

const notifPath = path.join(process.cwd(), 'apps/api/src/modules/notifications/notification-feed.service.ts');
if (fs.existsSync(notifPath)) {
    let content = fs.readFileSync(notifPath, 'utf8');
    content = content.replace(/metadata\s*:/g, 'metadata: notification.metadata as any, //');
    // It's safer to just any cast the metadata
    content = content.replace(/metadata:\s*data\.metadata/g, 'metadata: data.metadata as any');
    content = content.replace(/metadata:\s*n\.metadata/g, 'metadata: n.metadata as any');
    content = content.replace(/metadata:\s*notification\.metadata/g, 'metadata: notification.metadata as any');
    fs.writeFileSync(notifPath, content);
}

