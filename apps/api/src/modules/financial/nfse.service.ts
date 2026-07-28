import { SignedXml } from "xml-crypto";
import { DOMParser } from "@xmldom/xmldom";

// Configurações MOCK para a Prefeitura de Mogi das Cruzes (ABRASF)
const ABRASF_NAMESPACE = "http://www.abrasf.org.br/nfse.xsd";
const PREFEITURA_WS_URL = "https://servicos.mogidascruzes.sp.gov.br/tbw/services/Abrasf23?wsdl";

export class NfseService {
    /**
     * Gera o XML do RPS (Recibo Provisório de Serviços) Padrão ABRASF 2.03
     */
    generateRpsXml(invoiceData: any, configData: any): string {
        // MOCK: Geração da estrutura base do XML de Lote de RPS
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<EnviarLoteRpsEnvio xmlns="${ABRASF_NAMESPACE}">
    <LoteRps id="Lote_${invoiceData.batchNumber}" versao="2.03">
        <NumeroLote>${invoiceData.batchNumber}</NumeroLote>
        <CpfCnpj>
            <Cnpj>${configData.cnpj}</Cnpj>
        </CpfCnpj>
        <InscricaoMunicipal>${configData.inscricaoMunicipal}</InscricaoMunicipal>
        <QuantidadeRps>1</QuantidadeRps>
        <ListaRps>
            <Rps>
                <InfDeclaracaoPrestacaoServico id="Rps_${invoiceData.rpsNumber}">
                    <Rps>
                        <IdentificacaoRps>
                            <Numero>${invoiceData.rpsNumber}</Numero>
                            <Serie>${invoiceData.rpsSeries || "1"}</Serie>
                            <Tipo>1</Tipo>
                        </IdentificacaoRps>
                        <DataEmissao>${new Date().toISOString().split('T')[0]}</DataEmissao>
                        <Status>1</Status>
                    </Rps>
                    <Servico>
                        <Valores>
                            <ValorServicos>${invoiceData.value.toFixed(2)}</ValorServicos>
                            <ValorDeducoes>0.00</ValorDeducoes>
                            <ValorPis>0.00</ValorPis>
                            <ValorCofins>0.00</ValorCofins>
                            <ValorInss>0.00</ValorInss>
                            <ValorIr>0.00</ValorIr>
                            <ValorCsll>0.00</ValorCsll>
                            <OutrasRetencoes>0.00</OutrasRetencoes>
                            <ValorIss>${(invoiceData.value * 0.05).toFixed(2)}</ValorIss>
                            <Aliquota>5.00</Aliquota>
                            <DescontoIncondicionado>0.00</DescontoIncondicionado>
                            <DescontoCondicionado>0.00</DescontoCondicionado>
                        </Valores>
                        <IssRetido>2</IssRetido>
                        <ItemListaServico>${configData.itemListaServico}</ItemListaServico>
                        <CodigoTributacaoMunicipio>${configData.codigoTributacaoMunicipio}</CodigoTributacaoMunicipio>
                        <Discriminacao>${invoiceData.serviceDescription}</Discriminacao>
                        <CodigoMunicipio>3530607</CodigoMunicipio> <!-- Mogi das Cruzes IBGE -->
                        <ExigibilidadeISS>1</ExigibilidadeISS>
                        <MunicipioIncidencia>3530607</MunicipioIncidencia>
                    </Servico>
                    <Prestador>
                        <CpfCnpj>
                            <Cnpj>${configData.cnpj}</Cnpj>
                        </CpfCnpj>
                        <InscricaoMunicipal>${configData.inscricaoMunicipal}</InscricaoMunicipal>
                    </Prestador>
                    <Tomador>
                        <IdentificacaoTomador>
                            <CpfCnpj>
                                ${invoiceData.clientDocument.length > 11 ? `<Cnpj>${invoiceData.clientDocument.replace(/\D/g, '')}</Cnpj>` : `<Cpf>${invoiceData.clientDocument.replace(/\D/g, '')}</Cpf>`}
                            </CpfCnpj>
                        </IdentificacaoTomador>
                        <RazaoSocial>${invoiceData.clientName}</RazaoSocial>
                    </Tomador>
                </InfDeclaracaoPrestacaoServico>
            </Rps>
        </ListaRps>
    </LoteRps>
</EnviarLoteRpsEnvio>`;
        
        return xml;
    }

    /**
     * Assina o XML utilizando o certificado digital A1.
     * @requires xml-crypto
     */
    signXml(xmlStr: string, certificatePem: string, privateKeyPem: string, referenceId: string): string {
        try {
            const sig: any = new SignedXml();
            sig.addReference(`//*[@id="${referenceId}"]`, 
                ["http://www.w3.org/2000/09/xmldsig#enveloped-signature", "http://www.w3.org/TR/2001/REC-xml-c14n-20010315"],
                "http://www.w3.org/2000/09/xmldsig#sha1"
            );
            sig.signingKey = privateKeyPem;
            sig.keyInfoProvider = {
                getKeyInfo: () => `<X509Data><X509Certificate>${certificatePem}</X509Certificate></X509Data>`,
                getKey: () => privateKeyPem
            };
            
            sig.computeSignature(xmlStr);
            return sig.getSignedXml();
        } catch (error) {
            console.error("Erro ao assinar XML:", error);
            throw new Error("Falha na assinatura digital do XML.");
        }
    }

    /**
     * Transmite o Lote de RPS via SOAP para a Prefeitura
     */
    async transmitRpsBatch(signedXml: string): Promise<any> {
        // MOCK: Como não temos o certificado do cliente ainda, retornamos um sucesso simulado.
        console.log("Transmitting to Mogi das Cruzes WebService...", PREFEITURA_WS_URL);
        console.log("XML Payload:", signedXml);
        
        // Simulação de resposta do SOAP
        return {
            success: true,
            protocolNumber: `PROTO-${Math.floor(Math.random() * 1000000)}`,
            message: "Lote RPS recebido com sucesso (MOCK MODE)"
        };
    }
}
