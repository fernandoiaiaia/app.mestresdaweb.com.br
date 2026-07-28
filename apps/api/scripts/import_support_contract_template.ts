import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const elegantHtml = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1f2937; line-height: 1.7; max-width: 800px; margin: 0 auto; background-color: #ffffff;">
      
      <!-- Minimalist Header (White Background) -->
      <div style="padding: 50px 40px 20px 40px; text-align: center;">
        <img src="/branding/logo-negativo.png" alt="Logo" style="height: 120px; margin-bottom: 30px; filter: brightness(0);" />
        <h1 style="margin: 0; font-size: 20px; font-weight: 600; letter-spacing: 0.05em; color: #0f172a; text-transform: uppercase;">
          Contrato de Prestação de Serviços de<br>Suporte e Sustentação de Sistemas
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
              As partes acima qualificadas resolvem celebrar o presente Contrato de Prestação de Serviços de Suporte e Sustentação de Sistemas, regido pelas cláusulas abaixo, reconhecendo o equilíbrio contratual e a boa-fé na negociação.
            </p>
          </div>
        </div>

        <!-- Cláusula 1 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 1. Objeto
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          1.1. O presente instrumento tem por objeto a prestação de serviços de suporte técnico e sustentação de sistemas pela CONTRATADA à CONTRATANTE, mediante consumo de pacote mensal de horas, conforme condições estabelecidas neste contrato.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          1.2. Os serviços de suporte e sustentação abrangem toda e qualquer atividade técnica de desenvolvimento e manutenção de software, incluindo, de forma exemplificativa e não exaustiva:
        </p>
        <ul style="font-size: 14px; color: #334155; margin-bottom: 10px; list-style-type: lower-alpha; padding-left: 20px;">
          <li>correção de bugs e falhas em sistemas existentes;</li>
          <li>desenvolvimento de novas funcionalidades e melhorias;</li>
          <li>alterações de layout, interface e experiência do usuário;</li>
          <li>adequações de regras de negócio;</li>
          <li>criação e manutenção de integrações com APIs e serviços de terceiros;</li>
          <li>otimizações de performance e banco de dados;</li>
          <li>atualizações de dependências, frameworks e bibliotecas;</li>
          <li>adequações legais e regulatórias;</li>
          <li>configurações de ambiente, servidor e infraestrutura;</li>
          <li>suporte técnico a dúvidas e orientações operacionais;</li>
          <li>qualquer outra atividade técnica acordada entre as partes via chamado.</li>
        </ul>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          1.3. Cada atividade realizada será registrada em chamado, com descrição do serviço executado e horas consumidas, para controle e transparência de ambas as partes.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          1.4. Este contrato não garante a entrega de um escopo fixo, mas sim a disponibilidade da CONTRATADA para atender as demandas da CONTRATANTE dentro do pacote de horas contratado.
        </p>

        <!-- Cláusula 2 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 2. Pacote de Horas
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          2.1. A CONTRATANTE contrata o seguinte pacote mensal de horas:<br>
          <strong>Pacote:</strong> {{PACOTE_HORAS}} horas/mês<br>
          <strong>Valor da mensalidade:</strong> {{VALOR_MENSALIDADE}}<br>
          <strong>Valor da hora avulsa (excedente):</strong> {{VALOR_HORA_AVULSA}}
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          2.2. As horas do pacote mensal são disponibilizadas no primeiro dia de cada mês de competência.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          2.3. As horas não utilizadas no mês acumulam-se automaticamente por um período de 90 (noventa) dias corridos a partir da data de competência do mês em que foram disponibilizadas. Após esse prazo, as horas do mês correspondente expiram e não poderão ser utilizadas ou compensadas financeiramente.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          2.4. Exemplo de funcionamento do acúmulo: horas disponibilizadas em janeiro expiram em 1º de abril; horas de fevereiro expiram em 1º de maio, e assim sucessivamente, independentemente de quantas horas de outros meses estejam acumuladas.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          2.5. A CONTRATADA informará mensalmente o saldo de horas disponíveis, incluindo o detalhamento por mês de origem e respectiva data de expiração.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          2.6. Horas excedentes ao saldo disponível, quando solicitadas e aprovadas pela CONTRATANTE, serão cobradas pelo valor da hora avulsa definido no item 2.1, faturadas na competência seguinte.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          2.7. Não há conversão de horas em crédito financeiro, devolução de valores por horas não utilizadas ou transferência de horas para outro contratante.
        </p>

        <!-- Cláusula 3 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 3. Abertura e Gestão de Chamados
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          3.1. Os chamados de suporte serão abertos pela CONTRATANTE pelos seguintes canais:<br>
          l) WhatsApp: {{CANAL_WHATSAPP}} — para comunicação ágil e alinhamentos iniciais;<br>
          m) Sistema de chamados / e-mail: {{CANAL_EMAIL_SISTEMA}} — para registro formal, detalhamento e acompanhamento.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          3.2. Todo chamado deverá conter, no mínimo: descrição clara da demanda ou problema, sistema/módulo afetado e nível de prioridade indicado pela CONTRATANTE.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          3.3. A CONTRATADA poderá solicitar informações complementares para início da execução. O prazo de atendimento fica suspenso enquanto aguarda retorno da CONTRATANTE.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          3.4. Antes do início de qualquer atividade, a CONTRATADA enviará uma estimativa de horas para execução. A CONTRATANTE deverá aprovar a estimativa formalmente (por WhatsApp ou e-mail) para que o serviço seja iniciado.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          3.5. A aprovação da estimativa pela CONTRATANTE configura autorização expressa para consumo das horas correspondentes do saldo disponível.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          3.6. Após a execução, a CONTRATADA registrará no chamado as horas efetivamente consumidas. Caso a execução demande horas superiores à estimativa aprovada, a CONTRATADA comunicará a CONTRATANTE antes de prosseguir, salvo em situações emergenciais devidamente justificadas.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          3.7. A CONTRATANTE terá acesso ao histórico de chamados e ao extrato de consumo de horas a qualquer momento, mediante solicitação.
        </p>

        <!-- Cláusula 4 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 4. Prazos de Atendimento
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 15px; color: #334155;">
          4.1. Os chamados serão classificados pela CONTRATANTE nas seguintes prioridades, com os respectivos prazos de primeiro atendimento (resposta inicial, não necessariamente resolução):
        </p>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; text-align: left;">
          <thead>
            <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1; color: #0f172a;">
              <th style="padding: 12px;">Prioridade</th>
              <th style="padding: 12px;">Descrição</th>
              <th style="padding: 12px;">1º Atendimento</th>
              <th style="padding: 12px;">Horário</th>
            </tr>
          </thead>
          <tbody style="color: #334155;">
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px; font-weight: bold;">Crítica</td>
              <td style="padding: 12px;">Sistema fora do ar ou funcionalidade essencial indisponível</td>
              <td style="padding: 12px;">4 horas úteis</td>
              <td style="padding: 12px;">Seg–Sex, 9h–18h</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px; font-weight: bold;">Alta</td>
              <td style="padding: 12px;">Funcionalidade com impacto direto na operação do negócio</td>
              <td style="padding: 12px;">1 dia útil</td>
              <td style="padding: 12px;">Seg–Sex, 9h–18h</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px; font-weight: bold;">Normal</td>
              <td style="padding: 12px;">Melhorias, novas funcionalidades e demandas não urgentes</td>
              <td style="padding: 12px;">2 dias úteis</td>
              <td style="padding: 12px;">Seg–Sex, 9h–18h</td>
            </tr>
          </tbody>
        </table>

        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          4.2. Os prazos de primeiro atendimento referem-se à resposta inicial da CONTRATADA, não ao prazo de conclusão do serviço, que dependerá da complexidade da demanda e do saldo de horas disponível.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          4.3. O prazo de conclusão de cada atividade será informado pela CONTRATADA na estimativa enviada antes do início da execução, conforme Cláusula 3.4.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          4.4. O atendimento ocorrerá em dias úteis, das 9h às 18h, horário de Brasília. Atendimentos fora desse horário poderão ser realizados mediante acordo prévio e poderão ter fator de multiplicação de horas de 1,5x (hora e meia por hora executada).
        </p>

        <!-- Cláusula 5 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 5. Preço e Forma de Pagamento
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          5.1. O valor da mensalidade é fixo, conforme definido na Cláusula 2.1, independentemente do volume de horas consumidas no mês, desde que dentro do pacote contratado.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          5.2. O vencimento da mensalidade ocorre todo dia {{DIA_VENCIMENTO}} de cada mês, com o primeiro pagamento em {{DATA_PRIMEIRO_PAGAMENTO}}.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          5.3. O pagamento será realizado via: {{FORMA_PAGAMENTO}}.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          5.4. Horas excedentes ao pacote, quando aprovadas pela CONTRATANTE, serão faturadas separadamente na competência seguinte ao consumo.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          5.5. O não pagamento até a data de vencimento, após notificação formal com prazo de 5 (cinco) dias úteis para regularização, autorizará a CONTRATADA a suspender os atendimentos até a quitação do débito. Horas acumuladas ficam preservadas durante a suspensão.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          5.6. Sobre valores em atraso incidirão, após o prazo de cura: correção monetária pelo IPCA, multa de 2% (dois por cento) e juros de 1% (um por cento) ao mês.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          5.7. Os valores poderão ser reajustados anualmente pelo IPCA acumulado do período, mediante comunicação prévia de 30 (trinta) dias.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          5.8. Os valores contratados contemplam todos os tributos incidentes sobre a prestação dos serviços.
        </p>

        <!-- Cláusula 6 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 6. Obrigações da Contratada
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          6.1. Prestar os serviços de suporte e sustentação com qualidade técnica, dentro dos prazos acordados e do saldo de horas disponível.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          6.2. Registrar todas as atividades executadas em chamados, com descrição do serviço e horas consumidas, garantindo rastreabilidade e transparência.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          6.3. Enviar estimativa de horas antes do início de qualquer atividade e obter aprovação da CONTRATANTE, conforme Cláusula 3.4.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          6.4. Enviar extrato mensal de consumo de horas até o 5º (quinto) dia útil do mês seguinte, contendo: horas consumidas por chamado, saldo disponível por mês de origem e datas de expiração.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          6.5. Manter sigilo sobre os sistemas, dados, regras de negócio e informações da CONTRATANTE.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          6.6. Responsabilizar-se exclusivamente por seus colaboradores e prestadores de serviços, incluindo encargos trabalhistas e previdenciários.
        </p>

        <!-- Cláusula 7 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 7. Obrigações da Contratante
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          7.1. Efetuar os pagamentos mensais nos prazos contratados.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          7.2. Abrir chamados com informações claras e suficientes para a execução do serviço.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          7.3. Designar um ponto de contato responsável por abertura de chamados, aprovação de estimativas e comunicação com a CONTRATADA.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          7.4. Aprovar ou recusar estimativas de horas no prazo de 2 (dois) dias úteis após o recebimento. A ausência de manifestação dentro do prazo caracterizará recusa tácita, e o chamado ficará aguardando aprovação.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          7.5. Disponibilizar os acessos, credenciais, ambientes e informações necessárias para a execução dos serviços solicitados.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          7.6. Realizar testes e validar as entregas no prazo de 72 (setenta e duas) horas após a comunicação de conclusão do chamado. A ausência de manifestação caracterizará aceite tácito.
        </p>

        <!-- Cláusula 8 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 8. Propriedade Intelectual
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          8.1. Todos os desenvolvimentos, melhorias, integrações e demais produções intelectuais realizadas pela CONTRATADA no âmbito deste contrato serão de propriedade da CONTRATANTE, desde que integralmente pagas.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          8.2. A propriedade sobre cada entrega é transferida no momento do aceite da atividade correspondente, mediante quitação das horas consumidas.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          8.3. Ficam excluídos da cessão: frameworks, bibliotecas de terceiros, componentes de mercado e tecnologias de uso geral, que permanecem sujeitos às suas respectivas licenças.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          8.4. Em caso de inadimplência, a CONTRATADA poderá suspender os serviços, mas não poderá reivindicar a propriedade de desenvolvimentos já pagos e aceitos.
        </p>

        <!-- Cláusula 9 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 9. Vigência e Renovação
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          9.1. O presente contrato entra em vigor na data de sua assinatura, com prazo mínimo de 3 (três) meses.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          9.2. Após o prazo mínimo, o contrato será renovado automaticamente por períodos mensais sucessivos, salvo manifestação contrária de qualquer das partes com aviso prévio de 30 (trinta) dias.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          9.3. Durante o prazo mínimo, o cancelamento antecipado pela CONTRATANTE implicará pagamento dos meses restantes do período mínimo.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          9.4. Em caso de encerramento do contrato, as horas acumuladas ainda válidas (dentro do prazo de 90 dias) poderão ser utilizadas pela CONTRATANTE até o último dia de vigência contratual, não cabendo restituição financeira por horas não consumidas.
        </p>

        <!-- Cláusula 10 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 10. Rescisão
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          10.1. Após o prazo mínimo, qualquer das partes poderá rescindir o contrato mediante aviso prévio de 30 (trinta) dias, sem multa.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          10.2. A CONTRATADA poderá rescindir imediatamente, sem multa, nos seguintes casos:<br>
          n) inadimplência da CONTRATANTE por período superior a 15 (quinze) dias após o vencimento, mesmo após notificação;<br>
          o) uso dos serviços para fins ilegais ou que violem direitos de terceiros;<br>
          p) determinação legal ou judicial.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          10.3. A rescisão não afeta os direitos sobre desenvolvimentos já entregues, aceitos e pagos até a data da rescisão.
        </p>

        <!-- Cláusula 11 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 11. Limitação de Responsabilidade
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          11.1. A responsabilidade total da CONTRATADA por quaisquer danos decorrentes da prestação dos serviços fica limitada ao valor de 3 (três) mensalidades efetivamente pagas.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          11.2. A CONTRATADA não responderá por:<br>
          q) lucros cessantes, perda de faturamento ou perda de oportunidade;<br>
          r) danos decorrentes de informações incorretas ou incompletas fornecidas pela CONTRATANTE;<br>
          s) falhas em serviços de terceiros (APIs, plataformas, infraestrutura);<br>
          t) danos causados por alterações realizadas pela CONTRATANTE ou terceiros no sistema sem conhecimento da CONTRATADA;<br>
          u) danos indiretos ou consequenciais de qualquer natureza.
        </p>

        <!-- Cláusula 12 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 12. Confidencialidade
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          12.1. Ambas as partes obrigam-se a manter sigilo sobre todas as informações técnicas, comerciais, operacionais e estratégicas obtidas em razão deste contrato.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          12.2. A CONTRATADA compromete-se a não divulgar o nome da CONTRATANTE como cliente sem autorização expressa, ressalvado uso genérico em portfólio.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          12.3. A obrigação de confidencialidade permanece vigente durante a execução do contrato e por 2 (dois) anos após seu encerramento.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          12.4. Excluem-se da obrigação de sigilo as informações que já eram de conhecimento público ou que precisem ser divulgadas por determinação legal ou judicial.
        </p>

        <!-- Cláusula 13 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 13. Não Aliciamento
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          13.1. Durante a vigência contratual e por 1 (um) ano após seu término, a CONTRATANTE não poderá contratar, aliciar ou recrutar diretamente os colaboradores ou prestadores da CONTRATADA que tenham executado serviços neste contrato.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          13.2. O descumprimento sujeitará a CONTRATANTE ao pagamento de multa equivalente a 6 (seis) mensalidades do plano contratado.
        </p>

        <!-- Cláusula 14 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 14. Proteção de Dados — LGPD
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          14.1. A CONTRATADA poderá ter acesso a dados pessoais no exercício das atividades de suporte, atuando como Operadora nos termos da Lei n.º 13.709/2018 (LGPD), seguindo as instruções da CONTRATANTE na condição de Controladora.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          14.2. A CONTRATADA acessará os dados estritamente no necessário para execução dos serviços contratados, não os utilizando para qualquer outra finalidade.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          14.3. Em caso de incidente de segurança identificado durante a prestação dos serviços, a CONTRATADA notificará a CONTRATANTE em até 48 (quarenta e oito) horas.
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
          15.3. As partes reconhecem a plena validade de assinaturas eletrônicas e digitais (DocuSign, ClickSign, Gov.br e similares).
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
        name: 'Contrato Suporte e Sustentação (Mestres da Web)',
        description: 'Modelo oficial para prestação de serviços de banco de horas (suporte, bugs e melhorias).',
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
