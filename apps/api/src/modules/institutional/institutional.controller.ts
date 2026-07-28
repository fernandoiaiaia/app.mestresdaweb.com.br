import { Request, Response } from "express";
import { institutionalService } from "./institutional.service.js";
import crypto from "crypto";
import tls from "tls";
import fs from "fs";
import { encryptAES } from "../../utils/encryption.js";

export const institutionalController = {
    async get(req: Request, res: Response) {
        const data = await institutionalService.get(req.user!);
        res.json({ success: true, data });
    },

    async upsert(req: Request, res: Response) {
        const data = await institutionalService.upsert(req.body, req.user!);
        res.json({ success: true, data });
    },

    async uploadCertificate(req: Request, res: Response) {
        const file = req.file;
        const { password } = req.body;

        if (!file) {
            return res.status(400).json({ success: false, message: "Nenhum certificado enviado." });
        }

        if (!password) {
            fs.unlinkSync(file.path);
            return res.status(400).json({ success: false, message: "A senha do certificado é obrigatória." });
        }

        try {
            // Tentar criar um contexto seguro para validar o PFX/P12 e a senha
            const pfxBuffer = fs.readFileSync(file.path);
            tls.createSecureContext({
                pfx: pfxBuffer,
                passphrase: password,
            });
        } catch (error) {
            // Falha na validação
            fs.unlinkSync(file.path);
            return res.status(400).json({ 
                success: false, 
                message: "Senha incorreta ou arquivo de certificado corrompido/inválido." 
            });
        }

        // Armazenar informações no BD com a senha criptografada em AES-256
        const encryptedPassword = encryptAES(password);

        const data = {
            certFilename: file.filename,
            certPassword: encryptedPassword,
        };

        const updated = await institutionalService.upsert(data, req.user!);

        // Remover a senha criptografada crua da resposta
        const { certPassword: _, ...safeData } = updated as any;

        res.json({ success: true, data: safeData, message: "Certificado enviado e configurado com sucesso!" });
    },
};
