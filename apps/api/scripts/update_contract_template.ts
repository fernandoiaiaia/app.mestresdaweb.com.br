import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const id = '69fae49a-532f-40fa-a650-4354ea943af9';
  
  const elegantHtml = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1f2937; line-height: 1.7; max-width: 800px; margin: 0 auto; background-color: #ffffff;">
      
      <!-- Minimalist Header (White Background) -->
      <div style="padding: 50px 40px 20px 40px; text-align: center;">
        <!-- Logo with brightness(0) to make the white logo black and visible on white background, increased size significantly -->
        <img src="/branding/logo-negativo.png" alt="Logo" style="height: 120px; margin-bottom: 30px; filter: brightness(0);" />
        <h1 style="margin: 0; font-size: 20px; font-weight: 600; letter-spacing: 0.05em; color: #0f172a; text-transform: uppercase;">
          Contrato de Prestação de Serviços
        </h1>
        <div style="width: 40px; height: 2px; background-color: #3b82f6; margin: 16px auto 0 auto;"></div>
      </div>

      <!-- Contract Body -->
      <div style="padding: 20px 50px 40px 50px;">
        
        <!-- Meta Info -->
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 40px;">
          <div style="font-size: 12px; color: #64748b;">
            <span style="font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Ref:</span> {{CONTRACT_ID}}
          </div>
          <div style="font-size: 12px; color: #64748b;">
            <span style="font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Emissão:</span> {{DATE}}
          </div>
        </div>

        <!-- Parties Section -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 24px; margin-bottom: 40px;">
          <h2 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; margin: 0 0 16px 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">
            Identificação das Partes
          </h2>
          
          <div style="margin-bottom: 20px;">
            <p style="margin: 0; font-size: 14px; text-align: justify; color: #334155;">
              <strong style="color: #0f172a;">CONTRATADA:</strong> {{CONTRATADA_NOME}}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº {{CONTRATADA_CNPJ}}, com sede em {{CONTRATADA_ENDERECO}}.
            </p>
          </div>
          
          <div>
            <p style="margin: 0; font-size: 14px; text-align: justify; color: #334155;">
              <strong style="color: #0f172a;">CONTRATANTE:</strong> {{CONTRATANTE_NOME}}, inscrita no CPF/CNPJ sob o nº {{CONTRATANTE_DOCUMENTO}}.
            </p>
          </div>
        </div>

        <!-- Clauses -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px;">
          1. Do Objeto
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          O presente contrato tem como objeto a prestação de serviços especializados em <strong>{{SERVICO_DESCRICAO}}</strong>, conforme proposta técnica aprovada, que passa a fazer parte integrante deste instrumento.
        </p>

        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px;">
          2. Dos Valores e Condições
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          Pelos serviços prestados, a CONTRATANTE pagará à CONTRATADA o valor global de <strong>{{VALOR_TOTAL}}</strong>. O pagamento será efetuado em {{PARCELAS}} parcelas mensais, com vencimento todo dia {{DIA_VENCIMENTO}}.
        </p>

        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px;">
          3. Das Obrigações Mútuas
        </h2>
        <ul style="font-size: 14px; text-align: justify; color: #334155; padding-left: 20px; margin-bottom: 30px;">
          <li style="margin-bottom: 8px;">A CONTRATADA compromete-se a utilizar os melhores recursos técnicos para execução do objeto deste contrato.</li>
          <li style="margin-bottom: 8px;">A CONTRATANTE obriga-se a fornecer todas as informações e acessos necessários para o bom andamento dos serviços.</li>
          <li style="margin-bottom: 8px;">Ambas as partes guardarão estrito sigilo sobre as informações trocadas durante a vigência contratual.</li>
        </ul>

        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px;">
          4. Da Rescisão e Foro
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 50px; color: #334155;">
          Qualquer das partes poderá rescindir o presente contrato mediante aviso prévio de 30 (trinta) dias. Fica eleito o foro da Comarca de <strong>São Paulo/SP</strong> para dirimir quaisquer dúvidas oriundas deste instrumento.
        </p>

        <!-- Signatures -->
        <div style="margin-top: 60px; text-align: center; background-color: #f8fafc; padding: 40px; border-radius: 6px;">
          <p style="font-size: 14px; color: #475569; margin-bottom: 60px; font-style: italic;">
            E, por estarem de pleno e comum acordo, assinam digitalmente o presente instrumento.
          </p>
          
          <div style="display: flex; justify-content: space-between; gap: 40px;">
            <div style="flex: 1;">
              <div style="border-top: 1px solid #94a3b8; padding-top: 12px;">
                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #0f172a;">{{CONTRATADA_NOME}}</p>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Contratada</p>
              </div>
            </div>
            <div style="flex: 1;">
              <div style="border-top: 1px solid #94a3b8; padding-top: 12px;">
                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #0f172a;">{{CONTRATANTE_NOME}}</p>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Contratante</p>
              </div>
            </div>
          </div>
        </div>

      </div>
      
      <!-- Footer Note -->
      <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
        <p style="margin: 0; font-size: 11px; color: #64748b; letter-spacing: 0.05em;">
          DOCUMENTO COM VALIDADE JURÍDICA • ASSINADO ELETRONICAMENTE
        </p>
      </div>
      
    </div>
  `;

  try {
    const template = await prisma.contractTemplate.update({
      where: { id },
      data: {
        content: elegantHtml
      }
    });
    console.log('Template updated successfully:', template.id);
  } catch (err) {
    console.error('Error updating template:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
