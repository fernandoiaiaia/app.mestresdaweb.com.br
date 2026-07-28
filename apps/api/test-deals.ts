import { dealsService } from './src/modules/deals/deals.service.js';

async function main() {
    try {
        const dummyJwt = { userId: "e29fb425-e7d7-4fc9-be14-352510e286a9", role: "USER" };
        const deals = await dealsService.list(dummyJwt, { funnelId: "5a3ec88f-197a-46f4-9de7-49a9c7f82ce5" });
        console.log("Deals for Duda in Funnel 5a3ec...:", deals.length);
    } catch (e) {
        console.error("ERROR:", e);
    }
}
main();
