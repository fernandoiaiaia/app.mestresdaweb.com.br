import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const int = await prisma.integrationSetting.findFirst({
    where: { provider: 'anthropic', isActive: true }
  });
  const apiKey = (int?.credentials as any)?.apiKey;
  const models = ["claude-3-haiku-20240307", "claude-3-sonnet-20240229", "claude-3-opus-20240229", "claude-2.1", "claude-3-5-sonnet-20241022"];
  for (const m of models) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
            model: m,
            max_tokens: 10,
            messages: [{ role: "user", content: "Hi" }]
        })
      });
      const data = await response.json().catch(()=>null);
      console.log(`Model: ${m} - Status: ${response.status}`, data?.error?.message || 'OK');
  }
}
main().finally(() => prisma.$disconnect());
