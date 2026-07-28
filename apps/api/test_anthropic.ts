import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const int = await prisma.integrationSetting.findFirst({
    where: { provider: 'anthropic', isActive: true }
  });
  if (!int || !int.credentials) return;
  const creds = int.credentials as any;
  const apiKey = creds.apiKey;
  
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 10,
        messages: [{ role: "user", content: "Hello" }]
    })
  });
  console.log(response.status);
  const data = await response.json();
  console.log(data);
}
main().catch(console.error).finally(() => prisma.$disconnect());
