const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const elegantHtml = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1f2937; line-height: 1.7; max-width: 800px; margin: 0 auto; background-color: #ffffff;">
      
      <!-- Minimalist Header (White Background) -->
      <div style="padding: 50px 40px 20px 40px; text-align: center;">
        <img src="/branding/logo-negativo.png" alt="Logo" style="height: 120px; margin-bottom: 30px; filter: brightness(0);" />
        <h1 style="margin: 0; font-size: 20px; font-weight: 600; letter-spacing: 0.05em; color: #0f172a; text-transform: uppercase;">
          Contrato de Prestação de Serviços de<br>Hospedagem e Infraestrutura
        </h1>
        <div style="width: 40px; height: 2px; background-color: #3b82f6; margin: 16px auto 0 auto;"></div>
      </div>

      <!-- Contract Body -->
      <div style="padding: 20px 50px 40px 50px;">
        
        <!-- Parties Section -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 24px; margin-bottom: 40px;">
          <h2 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; margin: 0 0 16px 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">
            Identificação das Partes
          </h2>
          
          <div style="margin-bottom: 20px;">
            <p style="margin: 0; font-size: 14px; text-align: justify; color: #334155;">
              <strong style="color: #0f172a;">CONTRATADA:</strong> Mestres da Web (ou Empresa), pessoa jurídica de direito privado, inscrita no CNPJ sob o nº {{CONTRATADA_CNPJ}}, com sede em {{CONTRATADA_ENDERECO}}.
            </p>
          </div>
          
          <div>
            <p style="margin: 0; font-size: 14px; text-align: justify; color: #334155;">
              <strong style="color: #0f172a;">CONTRATANTE:</strong> {{CONTRATANTE_NOME}}, inscrita no CPF/CNPJ sob o nº {{CONTRATANTE_DOCUMENTO}}.
            </p>
          </div>
          
          <div style="margin-top: 16px;">
            <p style="margin: 0; font-size: 14px; text-align: justify; color: #334155;">
              As partes acima qualificadas resolvem celebrar o presente Contrato de Prestação de Serviços de Hospedagem e Infraestrutura, regido pelas cláusulas abaixo, reconhecendo o equilíbrio contratual e a boa-fé na negociação.
            </p>
          </div>
        </div>

        <!-- Cláusula 1 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 1. Objeto
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          1.1. O presente instrumento tem por objeto a prestação de serviços de hospedagem de sistema/aplicativo web e/ou aplicativo móvel em servidor próprio da CONTRATADA, conforme plano contratado descrito na Cláusula 2.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          1.2. Os serviços abrangem exclusivamente a disponibilização de infraestrutura de hospedagem (espaço em servidor, conectividade e disponibilidade do ambiente), não incluindo desenvolvimento, manutenção de código, suporte técnico ao sistema ou qualquer serviço de natureza evolutiva.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          1.3. A CONTRATADA hospedará exclusivamente o sistema/aplicativo objeto do contrato de desenvolvimento celebrado entre as partes ou indicado pela CONTRATANTE, vedada a utilização do servidor para outros fins sem autorização prévia e expressa.
        </p>

        <!-- Cláusula 2 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 2. Plano e Recursos Contratados
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          2.1. A CONTRATANTE contrata o seguinte plano de hospedagem:
        </p>
        <ul style="font-size: 14px; color: #334155; margin-bottom: 10px; list-style-type: none; padding-left: 10px;">
          <li><strong>Plano:</strong> {{PLANO_NOME}}</li>
          <li><strong>Espaço em disco:</strong> {{PLANO_DISCO}} GB</li>
          <li><strong>Transferência mensal de dados (banda):</strong> {{PLANO_BANDA}} GB</li>
          <li><strong>Ambiente(s):</strong> {{PLANO_AMBIENTES}}</li>
          <li><strong>Banco de dados:</strong> {{PLANO_BANCO}}</li>
          <li><strong>Certificado SSL:</strong> {{PLANO_SSL}}</li>
        </ul>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          2.2. Recursos adicionais não previstos no plano acima poderão ser contratados mediante Termo Aditivo, com ajuste de valor.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          2.3. O consumo de banda ou armazenamento acima dos limites contratados poderá resultar em limitação de acesso ou cobrança adicional, após comunicação prévia à CONTRATANTE.
        </p>

        <!-- Cláusula 3 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 3. Preço e Forma de Pagamento
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          3.1. O valor da mensalidade de hospedagem é de <strong>{{VALOR_MENSALIDADE}}</strong>, com vencimento todo dia {{DIA_VENCIMENTO}} de cada mês.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          3.2. O primeiro pagamento será realizado em {{DATA_PRIMEIRO_PAGAMENTO}}, referente à competência {{COMPETENCIA_PRIMEIRO_PAGAMENTO}}.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          3.3. O pagamento será realizado via: {{FORMA_PAGAMENTO}}.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          3.4. O não pagamento até a data de vencimento, após notificação formal com prazo de 5 (cinco) dias úteis para regularização, autorizará a CONTRATADA a suspender os serviços até a quitação do débito.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          3.5. Sobre valores em atraso incidirão, após o prazo de cura: correção monetária pelo IPCA, multa de 2% (dois por cento) e juros de 1% (um por cento) ao mês.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          3.6. Os valores poderão ser reajustados anualmente pelo índice IPCA acumulado do período, mediante comunicação prévia de 30 (trinta) dias.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          3.7. Os valores contratados contemplam todos os tributos incidentes sobre a prestação dos serviços.
        </p>

        <!-- Cláusula 4 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 4. Obrigações da Contratada
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          4.1. Disponibilizar a infraestrutura de hospedagem com disponibilidade mínima (uptime) de 99% (noventa e nove por cento) ao mês, excluídos os períodos de manutenção programada.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          4.2. Realizar manutenções programadas preferencialmente em horários de menor utilização (entre 00h e 06h), comunicando a CONTRATANTE com antecedência mínima de 48 (quarenta e oito) horas.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          4.3. Notificar a CONTRATANTE em até 2 (duas) horas após a identificação de indisponibilidade não programada que afete o ambiente contratado.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          4.4. Zelar pela segurança física e lógica do servidor, adotando medidas razoáveis de proteção contra acessos não autorizados.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          4.5. Manter os dados da CONTRATANTE em sigilo, não os acessando, transferindo ou divulgando a terceiros, salvo por determinação legal ou judicial.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          4.6. A responsabilidade da CONTRATADA limita-se à disponibilização da infraestrutura. A CONTRATADA não é responsável pelo conteúdo, funcionamento do código, regras de negócio ou dados do sistema hospedado.
        </p>

        <!-- Cláusula 5 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 5. Obrigações da Contratante
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          5.1. Efetuar os pagamentos mensais nos prazos contratados.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          5.2. Utilizar o servidor exclusivamente para a finalidade prevista neste contrato, sendo vedado o uso para:<br>
          a) envio de spam ou e-mails em massa não autorizados;<br>
          b) hospedagem de conteúdo ilegal, malicioso ou que viole direitos de terceiros;<br>
          c) atividades que prejudiquem a performance do servidor ou de outros clientes;<br>
          d) mineração de criptomoedas ou processamento massivo não autorizado.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          5.3. Manter seus dados de acesso (credenciais, senhas, chaves) em sigilo e comunicar imediatamente a CONTRATADA em caso de comprometimento.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          5.4. Responsabilizar-se pelo conteúdo hospedado, incluindo legalidade, veracidade e conformidade com a legislação vigente, respondendo por eventuais danos a terceiros.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          5.5. Realizar backup dos seus próprios dados e arquivos. O backup de responsabilidade da CONTRATADA, quando incluso no plano, é de caráter auxiliar e não substitui a obrigação da CONTRATANTE de manter cópias próprias.
        </p>

        <!-- Cláusula 6 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 6. Backup
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          6.1. A CONTRATADA realizará backup do ambiente hospedado com a seguinte periodicidade: {{PERIODICIDADE_BACKUP}}.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          6.2. O backup tem caráter auxiliar e de contingência. A CONTRATANTE é a principal responsável pela guarda e integridade de seus dados.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          6.3. A CONTRATADA não garante a recuperação integral de dados em todos os cenários, especialmente em casos de falhas causadas por terceiros, ataques cibernéticos em larga escala ou eventos de força maior.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          6.4. Solicitações de restauração de backup serão atendidas em até 2 (dois) dias úteis após a solicitação formal, desde que o backup esteja disponível e seja tecnicamente viável.
        </p>

        <!-- Cláusula 7 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 7. Disponibilidade e Nível de Serviço (SLA)
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          7.1. A CONTRATADA garante disponibilidade mínima de 99% (noventa e nove por cento) do ambiente ao mês, o que equivale a no máximo aproximadamente 7,2 horas de indisponibilidade mensal.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          7.2. Não são contabilizados no cálculo de indisponibilidade:<br>
          e) períodos de manutenção programada comunicados com antecedência;<br>
          f) indisponibilidades causadas por ações da CONTRATANTE ou de usuários do sistema;<br>
          g) falhas de conectividade de internet externas ao servidor da CONTRATADA;<br>
          h) ataques cibernéticos (DDoS e similares);<br>
          i) eventos de força maior.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          7.3. Em caso de descumprimento do SLA por responsabilidade comprovada da CONTRATADA, a CONTRATANTE terá direito a desconto proporcional na fatura do mês em que ocorreu a indisponibilidade, limitado a 30% (trinta por cento) do valor mensal.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          7.4. O desconto previsto no item 7.3 é a única compensação devida por indisponibilidade, não cabendo indenizações adicionais por lucros cessantes ou danos indiretos.
        </p>

        <!-- Cláusula 8 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 8. Vigência e Renovação
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          8.1. O presente contrato entra em vigor na data de sua assinatura, com prazo mínimo de 12 (doze) meses.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          8.2. Após o prazo mínimo, o contrato será renovado automaticamente por períodos mensais sucessivos, salvo manifestação contrária de qualquer das partes com aviso prévio de 30 (trinta) dias.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          8.3. Durante o prazo mínimo, o cancelamento antecipado pela CONTRATANTE implicará pagamento dos meses restantes do período mínimo, a título de cláusula penal.
        </p>

        <!-- Cláusula 9 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 9. Rescisão e Cancelamento
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          9.1. Após o período mínimo, qualquer das partes poderá rescindir o contrato mediante aviso prévio de 30 (trinta) dias, sem multa.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          9.2. A CONTRATADA poderá rescindir imediatamente, sem multa, nos seguintes casos:<br>
          j) inadimplência da CONTRATANTE por período superior a 15 (quinze) dias após o vencimento, mesmo após notificação;<br>
          k) uso indevido do servidor em desacordo com a Cláusula 5.2;<br>
          l) determinação legal ou judicial.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          9.3. Em caso de rescisão ou cancelamento, a CONTRATADA concederá prazo de 10 (dez) dias corridos para que a CONTRATANTE realize o backup e a migração dos seus dados, mantendo o ambiente disponível neste período.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          9.4. Após o prazo de 10 (dez) dias, a CONTRATADA poderá remover os dados do servidor, sem qualquer responsabilidade pela perda de informações não exportadas pela CONTRATANTE.
        </p>

        <!-- Cláusula 10 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 10. Migração e Portabilidade
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          10.1. A CONTRATANTE poderá solicitar a migração de seu sistema para outro provedor a qualquer tempo, mediante aviso prévio de 15 (quinze) dias.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          10.2. A CONTRATADA disponibilizará os arquivos e banco de dados do sistema em formato padrão de mercado (ex: .sql para banco de dados, .zip para arquivos), sem custos adicionais, desde que não haja débitos pendentes.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          10.3. A CONTRATADA não é responsável pela configuração do ambiente de destino nem pela compatibilidade do sistema com outros provedores.
        </p>

        <!-- Cláusula 11 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 11. Segurança e Proteção de Dados — LGPD
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          11.1. A CONTRATADA atuará como Operadora de dados pessoais eventualmente presentes no sistema hospedado, nos termos da Lei n.º 13.709/2018 (LGPD), seguindo as instruções da CONTRATANTE na condição de Controladora.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          11.2. A CONTRATADA adotará medidas técnicas e organizacionais razoáveis para proteger os dados contra acesso não autorizado, destruição, perda ou alteração indevida.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          11.3. Em caso de incidente de segurança que possa envolver dados pessoais, a CONTRATADA notificará a CONTRATANTE em até 48 (quarenta e oito) horas após a identificação.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          11.4. A CONTRATADA não acessará, processará ou compartilhará os dados do sistema hospedado além do estritamente necessário para a prestação dos serviços contratados.
        </p>

        <!-- Cláusula 12 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 12. Limitação de Responsabilidade
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          12.1. A responsabilidade total da CONTRATADA por quaisquer danos decorrentes da prestação dos serviços de hospedagem fica limitada ao valor de 3 (três) mensalidades efetivamente pagas.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          12.2. A CONTRATADA não responderá por:<br>
          m) lucros cessantes, perda de faturamento ou perda de oportunidade;<br>
          n) danos decorrentes de conteúdo ou código hospedado de responsabilidade da CONTRATANTE;<br>
          o) perda de dados por falhas de terceiros, ataques cibernéticos ou força maior;<br>
          p) incompatibilidade do sistema com atualizações de tecnologias de terceiros;<br>
          q) danos indiretos ou consequenciais de qualquer natureza.
        </p>

        <!-- Cláusula 13 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 13. Força Maior
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          13.1. Nenhuma das partes responderá por atrasos ou descumprimentos decorrentes de eventos fora de seu controle razoável, incluindo: ataques cibernéticos em larga escala, falhas de fornecimento de energia, falhas de telecomunicações, desastres naturais, determinações governamentais ou casos fortuitos.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          13.2. Durante o evento de força maior, as obrigações contratuais ficam suspensas pelo período necessário à normalização. A parte afetada deverá comunicar a outra em até 48 (quarenta e oito) horas após o início do evento.
        </p>

        <!-- Cláusula 14 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 14. Confidencialidade
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          14.1. Ambas as partes obrigam-se a manter sigilo sobre todas as informações técnicas, comerciais e operacionais obtidas em razão deste contrato.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          14.2. A obrigação de confidencialidade permanece vigente durante a execução do contrato e por 2 (dois) anos após seu encerramento.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          14.3. Excluem-se da obrigação de sigilo as informações que já eram de conhecimento público ou que precisem ser divulgadas por determinação legal ou judicial.
        </p>

        <!-- Cláusula 15 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 15. Disposições Gerais
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          15.1. Este contrato constitui título executivo extrajudicial, nos termos do art. 784 do Código de Processo Civil.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          15.2. Alterações somente terão validade mediante Termo Aditivo escrito e assinado por ambas as partes.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          15.3. As partes reconhecem a plena validade de assinaturas eletrônicas e digitais realizadas por plataformas especializadas (ex: DocuSign, ClickSign, Gov.br).
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          15.4. O presente contrato não gera vínculo trabalhista, societário ou associativo entre as partes.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          15.5. A nulidade de qualquer cláusula não afeta as demais, que permanecem em pleno vigor.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          15.6. Em caso de controvérsia, as partes comprometem-se a buscar solução amigável por até 15 (quinze) dias antes de qualquer medida judicial.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 50px; color: #334155;">
          15.7. Fica eleito o Foro da Comarca de <strong>{{CIDADE_ESTADO}}</strong> para dirimir quaisquer controvérsias, renunciando as partes a qualquer outro foro.
        </p>

        <!-- Signatures -->
        <div style="margin-top: 60px; text-align: center; background-color: #f8fafc; padding: 40px; border-radius: 6px;">
          <p style="font-size: 14px; color: #475569; margin-bottom: 20px; font-style: italic;">
            Por estarem justas e contratadas, firmam o presente instrumento em 2 (duas) vias de igual teor.<br/>
            Local e Data: {{CIDADE_ESTADO}}, {{DATA_ASSINATURA}}
          </p>
          
          <div style="display: flex; justify-content: space-between; gap: 40px; margin-top: 60px;">
            <div style="flex: 1;">
              <div style="border-top: 1px solid #94a3b8; padding-top: 12px;">
                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #0f172a;">{{CONTRATANTE_NOME}}</p>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Contratante</p>
              </div>
            </div>
            <div style="flex: 1;">
              <div style="border-top: 1px solid #94a3b8; padding-top: 12px;">
                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #0f172a;">{{CONTRATADA_NOME}}</p>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Contratada</p>
              </div>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; gap: 40px; margin-top: 60px;">
            <div style="flex: 1;">
              <div style="border-top: 1px solid #94a3b8; padding-top: 12px;">
                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #0f172a;">1ª Testemunha</p>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">CPF: {{TESTEMUNHA_1_CPF}}</p>
              </div>
            </div>
            <div style="flex: 1;">
              <div style="border-top: 1px solid #94a3b8; padding-top: 12px;">
                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #0f172a;">2ª Testemunha</p>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">CPF: {{TESTEMUNHA_2_CPF}}</p>
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
    const template = await prisma.contractTemplate.create({
      data: {
        name: 'Contrato Hospedagem Servidor (Mestres da Web)',
        description: 'Modelo oficial de prestação de serviços de hospedagem e infraestrutura.',
        content: elegantHtml,
        status: 'active'
      }
    });
    console.log('Template created successfully:', template.id);
  } catch (err) {
    console.error('Error creating template:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
