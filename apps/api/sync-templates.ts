import { getOwnerUserId } from "./src/lib/get-owner.js";
import { whatsappTemplateService } from "./src/modules/chatbot/chatbot.service.js";

async function main() {
  const ownerId = await getOwnerUserId();
  console.log("Owner ID:", ownerId);
  try {
     const res = await whatsappTemplateService.syncFromMeta(ownerId);
     console.log("Sync result:", res);
  } catch(e: any) {
     console.error("Sync error:", e.message);
  }
}
main().finally(() => process.exit(0));
