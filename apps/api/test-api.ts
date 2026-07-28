import { funnelsService } from './src/modules/funnels/funnels.service.js';

async function main() {
    try {
        const dummyJwt = { userId: "e29fb425-e7d7-4fc9-be14-352510e286a9", role: "VIEWER" };
        const funnels = await funnelsService.list(dummyJwt);
        console.log("Funnels for Duda:", JSON.stringify(funnels, null, 2));
    } catch (e) {
        console.error("ERROR:", e);
    }
}
main();
