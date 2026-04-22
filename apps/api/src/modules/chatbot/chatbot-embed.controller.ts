import { Request, Response, Router } from "express";
import { prisma } from "../../config/database.js";

const router: Router = Router();

// ═══════════════════════════════════════
// PUBLIC CHATBOT EMBED WIDGET
// ═══════════════════════════════════════

/**
 * Serves the JavaScript code to inject the Whatsbot widget into any website.
 * Users include this via <script src="https://api.domain.com/api/chatbot/embed.js?company=COMPANY_ID" defer></script>
 */
router.get("/embed.js", async (req: Request, res: Response) => {
    const companyId = req.query.company as string;
    
    if (!companyId) {
        return res.status(400).send("console.error('Whatsbot: Missing company ID');");
    }

    try {
        const settings = await prisma.chatbotSettings.findUnique({
            where: { userId: companyId }
        });

        if (!settings || !settings.embedEnabled) {
            return res.status(403).send("console.warn('Whatsbot: Widget disabled for this company');");
        }

        // Get the phone number from WhatsApp integration
        const integration = await prisma.integrationSetting.findFirst({
            where: { userId: companyId, provider: "whatsapp", isActive: true }
        });

        const creds = integration?.credentials as any;
        let phoneNumber = "";
        
        if (creds?.phoneNumberId) {
            // Need to get the actual display phone number from Meta API if possible, 
            // but usually companies just provide a direct wa.me link. 
            // We'll fallback to a custom field in embedConfig or just the ID for now.
        }

        const config = (settings.embedConfig as any) || {
            color: "#8b5cf6", // violet-500
            position: "bottom-right",
            text: "Fale conosco!",
            phone: ""
        };

        const waLink = `https://wa.me/${config.phone?.replace(/\\D/g, '') || ''}`;

        // Build the vanilla JS embed code
        const jsCode = `
(function() {
    // Prevent multiple initializations
    if (window.WhatsbotWidgetLoaded) return;
    window.WhatsbotWidgetLoaded = true;

    const config = ${JSON.stringify(config)};
    const waLink = "${waLink}";

    // Inject Styles
    const style = document.createElement('style');
    style.innerHTML = \`
        .whatsbot-widget {
            position: fixed;
            \${config.position === 'bottom-left' ? 'left: 20px;' : 'right: 20px;'}
            bottom: 20px;
            z-index: 999999;
            display: flex;
            align-items: flex-end;
            gap: 12px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        
        .whatsbot-bubble {
            background-color: white;
            color: #333;
            padding: 12px 16px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            font-size: 14px;
            font-weight: 500;
            opacity: 0;
            transform: translateY(10px);
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            pointer-events: none;
            position: relative;
        }

        .whatsbot-bubble::after {
            content: '';
            position: absolute;
            bottom: -6px;
            \${config.position === 'bottom-left' ? 'left: 20px;' : 'right: 20px;'}
            border-width: 6px 6px 0;
            border-style: solid;
            border-color: white transparent transparent transparent;
        }

        .whatsbot-button {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background-color: \${config.color};
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            cursor: pointer;
            transition: transform 0.2s ease;
        }

        .whatsbot-button:hover {
            transform: scale(1.05);
        }

        .whatsbot-button svg {
            width: 32px;
            height: 32px;
            fill: white;
        }

        @keyframes whatsbotPulse {
            0% { box-shadow: 0 0 0 0 \${config.color}80; }
            70% { box-shadow: 0 0 0 15px transparent; }
            100% { box-shadow: 0 0 0 0 transparent; }
        }

        .whatsbot-button {
            animation: whatsbotPulse 2s infinite;
        }
    \`;
    document.head.appendChild(style);

    // Create Container
    const container = document.createElement('div');
    container.className = 'whatsbot-widget';

    // Create Bubble
    const bubble = document.createElement('div');
    bubble.className = 'whatsbot-bubble';
    bubble.innerText = config.text;

    // Create Button
    const button = document.createElement('a');
    button.className = 'whatsbot-button';
    button.href = waLink;
    button.target = '_blank';
    button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>';

    // Append to DOM
    if (config.position === 'bottom-left') {
        container.appendChild(button);
        container.appendChild(bubble);
    } else {
        container.appendChild(bubble);
        container.appendChild(button);
    }
    
    document.body.appendChild(container);

    // Show bubble after 2 seconds
    setTimeout(() => {
        bubble.style.opacity = '1';
        bubble.style.transform = 'translateY(0)';
    }, 2000);

    // Hide bubble after 10 seconds
    setTimeout(() => {
        bubble.style.opacity = '0';
        bubble.style.transform = 'translateY(10px)';
    }, 12000);
})();
        `;

        res.setHeader("Content-Type", "application/javascript");
        res.send(jsCode);
    } catch (err) {
        res.status(500).send("console.error('Whatsbot: Error loading embed');");
    }
});

export default router;
