import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando a verificação de oportunidades (Deals) duplicadas...");

  const deals = await prisma.deal.findMany({
    include: {
      client: true,
      stage: true,
      funnel: true,
    }
  });

  // Group deals by a unique identifier for the "pessoa" (person).
  // Priority for grouping: phone -> email -> name -> clientId
  const dealsByPerson: Record<string, typeof deals> = {};

  for (const deal of deals) {
    if (!deal.client) {
      continue;
    }

    const phone = deal.client.phone ? deal.client.phone.replace(/\D/g, '') : null;
    const email = deal.client.email ? deal.client.email.toLowerCase().trim() : null;
    const name = deal.client.name ? deal.client.name.toLowerCase().trim() : null;
    const clientId = deal.clientId;

    const key = phone || email || name || clientId;
    if (!key) continue;

    if (!dealsByPerson[key]) {
      dealsByPerson[key] = [];
    }
    dealsByPerson[key].push(deal);
  }

  let deletedCount = 0;

  for (const key in dealsByPerson) {
    const personDeals = dealsByPerson[key];
    
    // If only one deal, no duplicates
    if (personDeals.length <= 1) {
      continue;
    }

    console.log(`\nEncontradas ${personDeals.length} oportunidades para a mesma pessoa (Chave: ${key})`);

    // We have duplicates. We need to keep only ONE.
    // "Dar prioridade para apagar as que estão duplicadas e estão em MQL."
    // So we sort the array to find the BEST ONE TO KEEP, and delete the rest.
    // Best to keep = NOT MQL. If both are same, keep the newest (or oldest). Let's keep the newest.
    
    personDeals.sort((a, b) => {
      const aIsMql = a.stage.name.toUpperCase().includes('MQL');
      const bIsMql = b.stage.name.toUpperCase().includes('MQL');

      // Se A é MQL e B não é, queremos apagar A, então B é melhor para manter (A > B)
      if (aIsMql && !bIsMql) return 1; 
      if (!aIsMql && bIsMql) return -1;
      
      // Se ambos são iguais (ambos MQL ou ambos não-MQL), manter o mais recente (maior createdAt)
      return b.createdAt.getTime() - a.createdAt.getTime(); 
    });

    // The first one in the sorted array is the one we KEEP.
    const dealToKeep = personDeals[0];
    const dealsToDelete = personDeals.slice(1);

    console.log(` -> Mantendo Deal ID: ${dealToKeep.id} | Estágio: ${dealToKeep.stage.name}`);

    for (const d of dealsToDelete) {
      console.log(` -> Apagando Deal ID: ${d.id} | Estágio: ${d.stage.name}`);
      
      // Uncomment to actually delete
      try {
        await prisma.deal.delete({ where: { id: d.id } });
        console.log(`    ✅ Deletado com sucesso: ${d.id}`);
        deletedCount++;
      } catch (err: any) {
        console.error(`    ❌ Erro ao deletar: ${err.message}`);
      }
    }
  }

  console.log(`\nProcesso concluído. Total de oportunidades duplicadas deletadas: ${deletedCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
