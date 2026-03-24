import { dealsRoutes } from './src/modules/deals/deals.routes.js';

console.log("Registered routes in dealsRoutes:");
dealsRoutes.stack.forEach((layer) => {
    if (layer.route) {
        console.log(`[${Object.keys(layer.route.methods).join(',').toUpperCase()}] ${layer.route.path}`);
    } else if (layer.name === 'router') {
        console.log("Nested router:", layer.regexp);
    }
});
