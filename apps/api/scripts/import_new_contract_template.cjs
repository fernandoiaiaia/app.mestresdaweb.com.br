const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const elegantHtml = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1f2937; line-height: 1.7; max-width: 800px; margin: 0 auto; background-color: #ffffff;">
      
      <!-- Minimalist Header (White Background) -->
      <div style="padding: 50px 40px 20px 40px; text-align: center;">
        <img src="/branding/logo-negativo.png" alt="Logo" style="height: 120px; margin-bottom: 30px; filter: brightness(0);" />
        <h1 style="margin: 0; font-size: 20px; font-weight: 600; letter-spacing: 0.05em; color: #0f172a; text-transform: uppercase;">
          Contrato de Desenvolvimento de Software<br>e Aplicativos Móveis
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
              As partes acima qualificadas, de comum acordo e na melhor forma de direito, resolvem celebrar o presente Contrato de Desenvolvimento de Software e Aplicativos Móveis, que se regerá pelas cláusulas e condições seguintes, reconhecendo que o presente instrumento reflete equilíbrio contratual e foi negociado de boa-fé entre as partes.
            </p>
          </div>
        </div>

        <!-- Cláusula 1 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 1. Objeto
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          1.1. O presente instrumento tem por objeto o desenvolvimento de software web e/ou aplicativo móvel, conforme especificações definidas no Documento de Levantamento de Escopo e Requisitos (LER) e demais Anexos que integram este contrato para todos os fins.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          1.2. O projeto será executado sob regime de CONTRATO FECHADO, com escopo delimitado conforme Anexos.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          1.3. Alterações de escopo, funcionalidades, integrações, regras de negócio ou requisitos técnicos dependerão de aprovação expressa de ambas as partes mediante Termo Aditivo, com eventual readequação de prazo e valor.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          1.4. A CONTRATADA está proibida de comercializar, reproduzir ou disponibilizar a terceiros o código-fonte desenvolvido especificamente para a CONTRATANTE, ressalvados frameworks, bibliotecas e componentes de uso geral de mercado.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          1.5. A CONTRATANTE terá acesso ao ambiente de homologação durante toda a execução do projeto, podendo acompanhar o progresso das entregas.
        </p>

        <!-- Cláusula 2 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 2. Preço e Forma de Pagamento
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          2.1. O valor total do contrato será de <strong>{{VALOR_TOTAL}}</strong>.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          2.2. Os pagamentos serão realizados conforme o seguinte parcelamento, de acordo com as datas definidas entre as partes:
        </p>
        <ul style="font-size: 14px; color: #334155; margin-bottom: 10px;">
          <li>Parcela 1: {{VALOR_ENTRADA}} — Entrada, devida na assinatura do contrato;</li>
          <li>Parcela 2: {{VALOR_PARCELA_2}} — Vencimento em {{DATA_PARCELA_2}};</li>
          <li>Parcela 3: {{VALOR_PARCELA_3}} — Vencimento em {{DATA_PARCELA_3}};</li>
          <li>(parcelas adicionais poderão ser incluídas conforme negociação das partes)</li>
        </ul>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          2.3. O não pagamento na data acordada, após notificação formal com prazo de 5 (cinco) dias úteis para regularização, autorizará a CONTRATADA a suspender os serviços até a quitação do débito.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          2.4. Sobre valores em atraso, após o prazo de cura de 5 (cinco) dias úteis, incidirão: correção monetária pelo IPCA, multa de 10% (dez por cento) e juros de 1% (um por cento) ao mês.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          2.5. Os valores contratados contemplam todos os tributos incidentes sobre a prestação dos serviços.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          2.6. As Notas Fiscais serão emitidas no momento de cada cobrança, conforme parcelamento definido no item 2.2.
        </p>

        <!-- Cláusula 3 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 3. Obrigações da Contratada
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          3.1. Desenvolver e entregar o Software conforme escopo contratado, utilizando boas práticas de desenvolvimento de software.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          3.2. Realizar testes funcionais antes de cada entrega, garantindo que as funcionalidades estejam operacionais conforme o escopo.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          3.3. Informar à CONTRATANTE, com antecedência mínima de 5 (cinco) dias úteis, eventuais impedimentos técnicos que possam impactar o prazo de entrega.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          3.4. Manter comunicação regular com a CONTRATANTE durante a execução do projeto, prestando informações sobre o andamento dos trabalhos sempre que solicitado.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          3.5. Responsabilizar-se exclusivamente por seus colaboradores, empregados e prestadores de serviços, incluindo encargos trabalhistas e previdenciários.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          3.6. Entregar o código-fonte devidamente comentado e documentado ao final do projeto, após quitação integral do contrato.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          3.7. A responsabilidade da CONTRATADA limita-se ao desenvolvimento e entrega do Software funcionando de acordo com o escopo contratado. A CONTRATADA não garante resultados comerciais, financeiros ou mercadológicos decorrentes da utilização do Software.
        </p>

        <!-- Cláusula 4 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 4. Obrigações da Contratante
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          4.1. Efetuar os pagamentos nos prazos contratados.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          4.2. Disponibilizar todas as informações, documentos, acessos e definições necessárias para a execução do projeto, em prazo razoável após solicitação formal da CONTRATADA.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          4.3. Designar um ponto de contato responsável por aprovações e comunicações durante todo o projeto.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          4.4. Manifestar-se formalmente sobre entregas, aprovações e solicitações da CONTRATADA dentro dos prazos previstos neste contrato.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          4.5. O atraso na entrega de informações, conteúdos, acessos ou aprovações implicará prorrogação automática dos prazos de execução pelo mesmo período do atraso.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          4.6. Responder pelas informações fornecidas para o desenvolvimento do projeto, incluindo veracidade de dados e legalidade dos conteúdos.
        </p>

        <!-- Cláusula 5 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 5. Aceite das Entregas
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          5.1. Toda entrega realizada pela CONTRATADA poderá ser enviada por e-mail, plataforma de gestão, sistema de chamados ou outro meio eletrônico que permita comprovação de recebimento.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          5.2. A CONTRATANTE deverá manifestar-se sobre a entrega no prazo máximo de 72 (setenta e duas) horas úteis após o recebimento.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          5.3. Caso a CONTRATANTE identifique não conformidade com o escopo contratado, deverá apontá-la fundamentadamente dentro do prazo do item 5.2, com descrição específica do problema.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          5.4. A ausência de manifestação dentro do prazo previsto caracterizará aceite tácito da entrega, para todos os fins contratuais.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          5.5. O aceite poderá ocorrer mediante e-mail, assinatura digital, plataforma de gestão ou qualquer outro meio eletrônico rastreável.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          5.6. Para fins deste contrato, define-se como entrega final a disponibilização do ambiente de homologação com todas as funcionalidades previstas no escopo, seguida de aceite formal pela CONTRATANTE.
        </p>

        <!-- Cláusula 6 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 6. Prazo de Entrega
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          6.1. A data de início do projeto é {{DATA_INICIO}}, e a data prevista para entrega final é {{DATA_ENTREGA}}.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          6.2. Entende-se por entrega final a disponibilização de todas as funcionalidades previstas no escopo em ambiente de homologação, para aceite formal pela CONTRATANTE conforme Cláusula 5.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          6.3. O prazo de entrega poderá ser prorrogado mediante comunicação formal, sempre que houver:<br>
          a) atraso da CONTRATANTE no cumprimento de suas obrigações;<br>
          b) alteração de escopo aprovada por Termo Aditivo;<br>
          c) dependência de terceiros não vinculados à CONTRATADA;<br>
          d) eventos de força maior ou caso fortuito.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          6.4. As prorrogações decorrentes de responsabilidade da CONTRATANTE não implicarão acréscimo no valor contratado, salvo quando gerarem custos adicionais demonstráveis.
        </p>

        <!-- Cláusula 7 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 7. Garantia
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          7.1. A CONTRATADA garante à CONTRATANTE que o Software será desenvolvido em conformidade com o escopo contratado e com as boas práticas de mercado.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          7.2. A garantia terá prazo de 12 (doze) meses contados da entrega formal do Software, conforme aceite previsto na Cláusula 5.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          7.3. Durante o período de garantia, a CONTRATADA se compromete a responder às solicitações de correção em até 5 (cinco) dias úteis, e a corrigir bugs críticos em até 10 (dez) dias úteis.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          7.4. A garantia cobre exclusivamente:<br>
          e) bugs e erros de lógica de programação;<br>
          f) falhas de implementação em desacordo com o escopo;<br>
          g) defeitos diretamente decorrentes do desenvolvimento realizado pela CONTRATADA.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          7.5. Para fins deste contrato, define-se bug como: comportamento do software que diverge do escopo contratado, causando mau funcionamento de funcionalidade já entregue e aceita. Novas funcionalidades, melhorias e mudanças de regra de negócio não configuram bugs.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          7.6. Não estão cobertos pela garantia:<br>
          h) novas funcionalidades ou melhorias não previstas no escopo;<br>
          i) alterações de layout ou regra de negócio posteriores ao aceite;<br>
          j) integrações não previstas originalmente;<br>
          k) modificações realizadas pela CONTRATANTE ou terceiros sem autorização da CONTRATADA;<br>
          l) falhas em serviços de terceiros (APIs, SDKs, plataformas externas);<br>
          m) falhas de infraestrutura não gerenciada pela CONTRATADA.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          7.7. A garantia não caracteriza contrato de manutenção ou sustentação. Serviços evolutivos e de manutenção continuada poderão ser contratados separadamente.
        </p>

        <!-- Cláusula 8 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 8. Propriedade Intelectual
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          8.1. Após a quitação integral do contrato, a CONTRATADA cederá à CONTRATANTE todos os direitos patrimoniais sobre o código-fonte desenvolvido especificamente para este projeto.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          8.2. A cessão somente ocorrerá após confirmação da quitação integral, mediante emissão de Termo de Cessão de Direitos.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          8.3. Ficam expressamente excluídos da cessão: frameworks, bibliotecas de terceiros, componentes de mercado, ferramentas e tecnologias de uso geral utilizadas no desenvolvimento, que permanecem sujeitos às suas respectivas licenças.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          8.4. Após a transferência dos direitos, a CONTRATANTE poderá utilizar, comercializar, licenciar, distribuir e explorar economicamente o software sem restrições.
        </p>

        <!-- Cláusula 9 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 9. Publicação e Implantação
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          9.1. A disponibilização do sistema em ambiente de produção ocorrerá somente após quitação integral do contrato.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          9.2. A publicação em App Store, Google Play ou outras lojas ocorrerá somente após quitação integral do contrato.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          9.3. Durante a execução do projeto, a CONTRATANTE terá acesso ao ambiente de homologação para acompanhar o desenvolvimento e realizar testes.
        </p>

        <!-- Cláusula 10 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 10. Rescisão
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          10.1. O contrato poderá ser rescindido por mútuo acordo, a qualquer tempo, mediante Termo de Rescisão assinado por ambas as partes.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          10.2. Rescisão por iniciativa da CONTRATANTE: deverá efetuar o pagamento dos serviços executados até a data da rescisão, acrescido de multa de 15% (quinze por cento) sobre o saldo contratual remanescente, a título compensatório.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          10.3. Rescisão por responsabilidade comprovada da CONTRATADA: a CONTRATADA deverá entregar os serviços executados, restituir proporcionalmente os valores referentes aos serviços não executados, e pagar multa de 10% (dez por cento) do valor total do contrato.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          10.4. Em ambos os casos, antes da rescisão unilateral, a parte que a pretende deve notificar a outra formalmente, concedendo prazo de 15 (quinze) dias úteis para regularização ou acordo.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          10.5. A multa prevista nesta cláusula tem caráter compensatório e substitui demais penalidades indenizatórias relacionadas ao mesmo fato gerador, ressalvados casos de dolo comprovado.
        </p>

        <!-- Cláusula 11 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 11. Serviços e Plataformas de Terceiros
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          11.1. A CONTRATADA não será responsável por falhas, indisponibilidades, alterações de políticas, limitações técnicas, suspensões ou encerramento de serviços prestados por terceiros.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          11.2. Incluem-se, sem limitação: Apple, Google, Microsoft, Amazon, Meta, OpenAI, Anthropic, provedores de hospedagem, APIs, SDKs e gateways de pagamento.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          11.3. Reprovações ou exigências das lojas de aplicativos que não decorram de erro de desenvolvimento não caracterizam inadimplemento da CONTRATADA.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          11.4. A CONTRATADA, ao tomar conhecimento de problemas com serviços de terceiros que impactem o projeto, notificará a CONTRATANTE no prazo máximo de 2 (dois) dias úteis, apresentando alternativas quando disponíveis.
        </p>

        <!-- Cláusula 12 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 12. Limitação de Responsabilidade
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          12.1. A responsabilidade total da CONTRATADA fica limitada a 50% (cinquenta por cento) do valor total efetivamente pago pela CONTRATANTE no âmbito deste contrato.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          12.2. A CONTRATADA não responderá por:<br>
          n) lucros cessantes ou perda de faturamento;<br>
          o) perda de oportunidade ou danos consequenciais;<br>
          p) danos indiretos ou perda de clientes;<br>
          q) perda de dados causada por terceiros ou por uso inadequado do sistema.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          12.3. A limitação desta cláusula aplica-se às responsabilidades contratuais, extracontratuais, civis, tecnológicas e operacionais, nos limites da legislação brasileira.
        </p>

        <!-- Cláusula 13 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 13. Confidencialidade
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          13.1. Ambas as partes obrigam-se a manter sigilo sobre todas as informações comerciais, técnicas, operacionais e estratégicas obtidas em razão deste contrato.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          13.2. A CONTRATADA se compromete a não divulgar o nome da CONTRATANTE como cliente sem autorização expressa, ressalvado o uso genérico em portfólio (ex: "sistema para empresa do setor X").
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          13.3. As obrigações de confidencialidade permanecem vigentes durante a execução do contrato e por 2 (dois) anos após seu encerramento.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          13.4. Excluem-se da obrigação de sigilo as informações que: (a) já eram de conhecimento público; (b) precisam ser divulgadas por determinação legal ou judicial.
        </p>

        <!-- Cláusula 14 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 14. Não Aliciamento
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          14.1. Durante a vigência contratual e por 1 (um) ano após seu término, nenhuma das partes poderá contratar, aliciar ou recrutar diretamente os colaboradores ou prestadores da outra parte que tenham participado diretamente deste projeto.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          14.2. O descumprimento sujeitará a parte infratora ao pagamento de multa equivalente a 30% (trinta por cento) do valor total do contrato, sem prejuízo de perdas e danos adicionais comprováveis.
        </p>

        <!-- Cláusula 15 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 15. Proteção de Dados — LGPD
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          15.1. Cada parte responderá exclusivamente pelos atos praticados no âmbito de sua própria atuação como Controladora ou Operadora de dados pessoais, conforme Lei n.º 13.709/2018 (LGPD).
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          15.2. A CONTRATADA responderá apenas por incidentes comprovadamente decorrentes de falhas diretamente atribuíveis ao desenvolvimento realizado.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          15.3. A CONTRATADA não responderá por incidentes decorrentes de: uso inadequado do sistema, compartilhamento indevido de credenciais, falhas de infraestrutura não gerenciada pela CONTRATADA ou atos de terceiros.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          15.4. Em caso de incidente de segurança identificado pela CONTRATADA que possa envolver dados da CONTRATANTE, a CONTRATADA notificará a CONTRATANTE em até 48 (quarenta e oito) horas.
        </p>

        <!-- Cláusula 16 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 16. Força Maior e Caso Fortuito
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          16.1. Nenhuma das partes responderá por atrasos ou descumprimentos decorrentes de eventos fora de seu controle razoável, incluindo:<br>
          r) indisponibilidade de provedores de nuvem ou telecomunicações;<br>
          s) ataques cibernéticos em larga escala;<br>
          t) falhas generalizadas de infraestrutura tecnológica;<br>
          u) alterações regulatórias impostas por órgãos públicos ou plataformas essenciais ao projeto;<br>
          v) eventos de força maior ou caso fortuito previstos na legislação brasileira.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          16.2. Durante tais eventos, os prazos contratuais ficarão suspensos pelo período necessário à normalização. A parte afetada notificará a outra no prazo de 3 (três) dias úteis após o início do evento.
        </p>

        <!-- Cláusula 17 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 17. Mediação e Foro
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          17.1. Em caso de controvérsia, as partes comprometem-se a buscar, primeiramente, solução amigável mediante negociação direta por até 15 (quinze) dias corridos após notificação formal.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          17.2. Não havendo acordo, as partes poderão recorrer à mediação extrajudicial antes de qualquer medida judicial, o que é expressamente recomendado como alternativa mais célere e menos onerosa.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 30px; color: #334155;">
          17.3. Persistindo o conflito, fica eleito o Foro da Comarca de <strong>{{CIDADE_ESTADO}}</strong> para dirimir quaisquer controvérsias oriundas deste contrato, renunciando as partes a qualquer outro, por mais privilegiado que seja.
        </p>

        <!-- Cláusula 18 -->
        <h2 style="font-size: 16px; color: #0f172a; margin: 40px 0 16px 0; font-weight: 600; border-left: 3px solid #3b82f6; padding-left: 12px; text-transform: uppercase;">
          Cláusula 18. Disposições Gerais
        </h2>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          18.1. Este contrato constitui título executivo extrajudicial, nos termos do art. 784 do Código de Processo Civil.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          18.2. Alterações ao presente contrato somente terão validade mediante Termo Aditivo escrito e assinado por ambas as partes.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          18.3. As partes reconhecem a plena validade de assinaturas eletrônicas e digitais realizadas por plataformas especializadas (ex: DocuSign, ClickSign, Gov.br).
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          18.4. O presente contrato não gera vínculo trabalhista, societário ou associativo entre as partes ou seus colaboradores.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 10px; color: #334155;">
          18.5. A nulidade ou invalidade de qualquer cláusula não afeta as demais, que permanecem em pleno vigor.
        </p>
        <p style="font-size: 14px; text-align: justify; margin-bottom: 50px; color: #334155;">
          18.6. Este contrato é regido pelas leis da República Federativa do Brasil.
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
          DOCUMENTO COM VALIDADE JURÍDICA • ASSINADO ELETRONICAMENTE<br>
          Anexo I — Documento de Levantamento de Escopo e Requisitos (LER)
        </p>
      </div>
      
    </div>
  `;

  try {
    const template = await prisma.contractTemplate.create({
      data: {
        name: 'Contrato Desenvolvimento de Software (Mestres da Web 2026)',
        description: 'Modelo oficial completo extraído do PDF (18 cláusulas) para projetos de software e apps',
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
