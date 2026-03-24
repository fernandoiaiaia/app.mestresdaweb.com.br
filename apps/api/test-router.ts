import { app } from './src/app.js';
import request from 'supertest';
import { signAccessToken } from './src/lib/jwt.js';

async function test() {
    try {
        const token = signAccessToken({ userId: 'e1fffc22-2646-4e5b-b9ab-b1bcaecbc5d5', role: 'admin' });

        const req1 = await request(app)
            .get('/api/deals/2f08596b-17e6-4c1d-a79b-1c4dbb38b793')
            .set('Authorization', `Bearer ${token}`);

        console.log("Status GET /:id ->", req1.status);
        console.log("Body GET /:id ->", req1.body);

        const req2 = await request(app)
            .get('/api/deals')
            .set('Authorization', `Bearer ${token}`);

        console.log("Status GET / ->", req2.status);
    } catch (e) {
        console.error("Test error:", e);
    }
}
test();
