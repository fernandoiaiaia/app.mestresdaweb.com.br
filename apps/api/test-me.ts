import { authMiddleware } from './src/middlewares/auth.middleware.js';
import { authController } from './src/modules/auth/auth.controller.js';
import jwt from 'jsonwebtoken';

const req: any = {
    headers: {
        authorization: 'Bearer ' + jwt.sign({ userId: 'c4144105-6ad1-4da6-ad69-79dd60f0fb90', role: 'CLIENT' }, 'super-secret-access-key-change-in-prod')
    }
};

const res: any = {
    status: (code: number) => {
        console.log('Status:', code);
        return res;
    },
    json: (data: any) => {
        console.log('JSON:', data);
        return res;
    }
};

const next = () => {
    console.log('Middleware passed. req.user:', req.user);
    authController.me(req, res).catch(console.error);
};

authMiddleware(req, res, next);
