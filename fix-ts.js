const fs = require('fs');
const path = require('path');

const filesToProcess = [
    'apps/api/src/modules/dev-projects/dev-projects.controller.ts',
    'apps/api/src/modules/leads/leads.controller.ts'
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

const notifPath = path.join(process.cwd(), 'apps/api/src/modules/notifications/notification-feed.service.ts');
if (fs.existsSync(notifPath)) {
    let content = fs.readFileSync(notifPath, 'utf8');
    content = content.replace(/metadata: notification\.metadata,/g, 'metadata: notification.metadata as any,');
    fs.writeFileSync(notifPath, content);
    console.log("Patched " + notifPath);
}
