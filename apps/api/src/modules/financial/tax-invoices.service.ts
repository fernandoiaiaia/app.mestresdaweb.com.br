import { prisma } from "../../config/database.js";
import { NfseService } from "./nfse.service.js";

const nfseService = new NfseService();

export class TaxInvoicesService {
    async getInvoices(userId: string) {
        return prisma.taxInvoice.findMany({
            where: { userId },
            orderBy: { issueDate: 'desc' }
        });
    }

    async createInvoice(userId: string, data: { clientName: string; clientDocument: string; serviceDescription: string; value: number }) {
        // MOCK DATA for ABRASF config (this should come from the user's settings DB)
        const configData = {
            cnpj: "00000000000100", // Fake CNPJ
            inscricaoMunicipal: "123456", // Fake IM
            itemListaServico: "01.01", // Fake LC 116
            codigoTributacaoMunicipio: "0101001",
        };

        // Determine RPS Number (mock sequential)
        const count = await prisma.taxInvoice.count({ where: { userId } });
        const rpsNumber = count + 1;
        const batchNumber = count + 1;

        const invoiceData = {
            ...data,
            rpsNumber,
            rpsSeries: "1",
            batchNumber
        };

        // 1. Build ABRASF XML
        const xml = nfseService.generateRpsXml(invoiceData, configData);

        // 2. Sign XML (MOCK - we don't have cert yet)
        const signedXml = xml; // In reality: nfseService.signXml(xml, cert, key, `Rps_${rpsNumber}`);

        // 3. Transmit (MOCK)
        const response = await nfseService.transmitRpsBatch(signedXml);

        // 4. Save to DB
        return prisma.taxInvoice.create({
            data: {
                userId,
                clientName: data.clientName,
                clientDocument: data.clientDocument,
                serviceDescription: data.serviceDescription,
                value: data.value,
                status: 'emitted',
                rpsNumber: invoiceData.rpsNumber,
                rpsSeries: invoiceData.rpsSeries,
                batchNumber: invoiceData.batchNumber,
                protocolNumber: response.protocolNumber
            }
        });
    }

    async cancelInvoice(userId: string, invoiceId: string) {
        const invoice = await prisma.taxInvoice.findFirst({
            where: { id: invoiceId, userId }
        });

        if (!invoice) throw new Error("Invoice not found");
        if (invoice.status === 'cancelled') throw new Error("Invoice already cancelled");

        return prisma.taxInvoice.update({
            where: { id: invoiceId },
            data: { status: 'cancelled' }
        });
    }
}
