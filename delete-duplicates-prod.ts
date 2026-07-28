import axios from 'axios';

const BASE_URL = 'https://api.mestresdaweb.com.br';
// COLOQUE SEU TOKEN AQUI (pegue no localStorage "accessToken" do advisor.mestresdaweb.com.br)
const TOKEN = 'SEU_TOKEN_AQUI';

async function deleteDuplicatesInProd() {
  if (TOKEN === 'SEU_TOKEN_AQUI') {
    console.error("❌ Por favor, adicione o TOKEN neste arquivo (linha 5) para que eu possa rodar a limpeza.");
    return;
  }

  const api = axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${TOKEN}`
    }
  });

  try {
    console.log("⏳ Buscando negócios (Deals) no servidor...");
    // A rota /api/deals pode ser paginada. Ajuste de limite/offset se necessário.
    const response = await api.get('/api/deals?limit=1000');
    const deals = response.data.deals || response.data;
    
    if (!deals || !Array.isArray(deals)) {
      console.log("Nenhum deal retornado ou formato inesperado.");
      return;
    }

    const dealsByPerson: Record<string, any[]> = {};

    for (const deal of deals) {
      if (!deal.client) continue;

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
      
      if (personDeals.length <= 1) {
        continue;
      }

      console.log(`\nEncontradas ${personDeals.length} oportunidades para a mesma pessoa (Chave: ${key})`);

      // Ordenar: MQL -> Deletar, Não-MQL -> Manter.
      personDeals.sort((a, b) => {
        const stageA = a.stage?.name?.toUpperCase() || '';
        const stageB = b.stage?.name?.toUpperCase() || '';
        const aIsMql = stageA.includes('MQL');
        const bIsMql = stageB.includes('MQL');

        if (aIsMql && !bIsMql) return 1; 
        if (!aIsMql && bIsMql) return -1;
        
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; 
      });

      const dealToKeep = personDeals[0];
      const dealsToDelete = personDeals.slice(1);

      console.log(` -> Mantendo Deal ID: ${dealToKeep.id} | Estágio: ${dealToKeep.stage?.name}`);

      for (const d of dealsToDelete) {
        console.log(` -> Apagando Deal ID: ${d.id} | Estágio: ${d.stage?.name}`);
        
        try {
          await api.delete(`/api/deals/${d.id}`);
          console.log(`    ✅ Deletado com sucesso: ${d.id}`);
          deletedCount++;
        } catch (err: any) {
          console.error(`    ❌ Erro ao deletar ${d.id}:`, err.response?.data?.message || err.message);
        }
      }
    }

    console.log(`\nProcesso concluído. Total de oportunidades duplicadas deletadas em PRD: ${deletedCount}`);

  } catch (e: any) {
    console.error("Erro geral na execução:", e.response?.data?.message || e.message);
  }
}

deleteDuplicatesInProd();
