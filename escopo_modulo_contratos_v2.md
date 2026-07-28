

**ESCOPO TÉCNICO**

Módulo de Criação e Assinatura de Contratos

Software Administrativo Financeiro

| MÓDULO 01  Modelos |
| :---- |

|   TELA  Listagem de modelos de contrato |
| :---- |

| Listar modelos cadastrados |
| :---- |

Exibe todos os modelos de contrato criados pela contratada em formato de lista ou grade.

* Colunas: nome do modelo, data de criação, última atualização, status (ativo/inativo).

* Filtros por nome e status.

* Ordenação por data ou nome.

| Criar novo modelo |
| :---- |

Botão de ação que abre o fluxo de criação de modelo de contrato.

| Editar / Duplicar / Excluir modelo |
| :---- |

Ações disponíveis em cada item da listagem.

* Editar: abre o editor do modelo existente.

* Duplicar: cria uma cópia com sufixo '(cópia)' para edição.

* Excluir: confirmação antes de remover. Modelos vinculados a contratos ativos não podem ser excluídos.

| Ativar / Inativar modelo |
| :---- |

Alterna o status do modelo. Modelos inativos não aparecem na seleção ao criar um novo contrato.

|   TELA  Editor de modelo de contrato |
| :---- |

| Geração por IA |
| :---- |

A IA gera o modelo completo com base em parâmetros informados pela contratada.

* Parâmetros: tipo de serviço, tom jurídico, cláusulas obrigatórias, prazo padrão, foro.

* Resultado exibido no editor de texto para revisão antes de salvar.

| Edição manual do contrato |
| :---- |

Editor de texto rico para digitação e formatação livre do contrato.

* Suporte a títulos, parágrafos, listas, negrito, itálico e sublinhado.

* Inserção de variáveis dinâmicas (ex: {{nome\_contratante}}, {{valor}}, {{data}}) que serão preenchidas na criação do contrato.

| Biblioteca de cláusulas avulsas |
| :---- |

Painel lateral com cláusulas pré-cadastradas que podem ser inseridas no modelo com um clique.

* Cláusulas organizadas por categoria (pagamento, rescisão, confidencialidade, etc.).

* Possibilidade de criar e gerenciar cláusulas avulsas diretamente neste painel.

| Versionamento do modelo |
| :---- |

Cada vez que o modelo é salvo, uma nova versão é registrada.

* Histórico de versões acessível no painel lateral.

* Permite restaurar uma versão anterior.

| Salvar modelo |
| :---- |

Salva o modelo com nome, descrição e status (ativo/inativo).

|   TELA  Modelos de e-mail |
| :---- |

| Listar modelos de e-mail |
| :---- |

Exibe todos os modelos de e-mail cadastrados.

* Colunas: nome, assunto, modelo de contrato vinculado, status.

* Filtros por nome e contrato vinculado.

| Criar / Editar modelo de e-mail |
| :---- |

Formulário de criação e edição de modelo de e-mail.

* Campos: nome do modelo, assunto, corpo do e-mail (editor rico).

* Suporte a variáveis dinâmicas no corpo e no assunto (ex: {{nome\_contratante}}, {{link\_contrato}}).

* Vinculação a um ou mais modelos de contrato.

| Excluir modelo de e-mail |
| :---- |

Remove o modelo com confirmação. Modelos em uso em contratos ativos não podem ser excluídos.

| MÓDULO 02  Contratos |
| :---- |

|   TELA  Listagem de contratos |
| :---- |

| Listar contratos |
| :---- |

Exibe todos os contratos da contratada com seus respectivos status.

* Colunas: número do contrato, contratante, objeto, valor, data de criação, prazo de assinatura, status.

* Status possíveis: Rascunho · Em revisão · Enviado · Em assinatura · Assinado · Cancelado · Arquivado.

| Filtrar e buscar contratos |
| :---- |

Ferramentas de busca e filtragem da listagem.

* Busca por nome do contratante, número do contrato ou objeto.

* Filtro por status, período de criação e valor.

* Ordenação por data, valor ou status.

| Criar novo contrato |
| :---- |

Botão que inicia o fluxo de criação de contrato.

| Acessar contrato |
| :---- |

Clique em qualquer contrato da lista abre a tela de detalhe do contrato.

|   TELA  Criação e edição de contrato |
| :---- |

| Dados das partes |
| :---- |

Preenchimento das informações de contratante e contratada.

* Contratada: pré-preenchida com os dados da empresa cadastrados no sistema.

* Contratante: busca por cliente cadastrado no CRM ou preenchimento manual (razão social/nome, CPF/CNPJ, endereço, e-mail, telefone).

| Objeto e descrição do contrato |
| :---- |

Campo de texto livre para descrever o objeto e escopo do contrato.

| Importação do escopo do CRM (ANEXO 1\) |
| :---- |

Busca e seleção do escopo do cliente diretamente do CRM (advisor.mestresdaweb.com.br).

* Campo de busca por cliente — exibe os escopos disponíveis.

* Escopo selecionado é inserido automaticamente como ANEXO 1 do contrato.

* Possibilidade de remover ou trocar o escopo selecionado.

| Valor e condições de pagamento |
| :---- |

Configuração financeira do contrato.

* Valor total do contrato.

* Meio de pagamento (PIX, boleto, cartão, transferência, etc.).

* Parcelamento: número de parcelas e vencimentos.

| Assinantes |
| :---- |

Cadastro de todas as pessoas que irão assinar o contrato.

* Campos por assinante: nome completo, e-mail, papel (contratante, contratada, testemunha).

* Adição de múltiplos assinantes por parte (ex.: dois sócios do contratante).

* Assinaturas processadas de forma simultânea — todos recebem o código ao mesmo tempo.

| Prazo de assinatura |
| :---- |

Data-limite para que todas as partes assinem.

* Ao vencer o prazo sem assinatura completa, o contrato é cancelado automaticamente.

* Configuração de frequência e quantidade de lembretes antes do vencimento.

| Anexos |
| :---- |

Inclusão de arquivos complementares ao contrato.

* Formatos aceitos: PDF e imagem (JPG, PNG).

* Múltiplos anexos permitidos além do ANEXO 1 (escopo do CRM).

* Cada anexo recebe um número sequencial (ANEXO 2, ANEXO 3...).

| Seleção do modelo de e-mail |
| :---- |

Escolha do modelo de e-mail que será usado no envio do contrato.

* Exibe apenas os modelos vinculados ao modelo de contrato utilizado.

* Prévia do e-mail com variáveis preenchidas antes do envio.

| Analisar riscos (IA) |
| :---- |

Botão que aciona a análise do contrato pela IA antes do envio.

* A IA identifica lacunas, ambiguidades e riscos em relação à contratada.

* Resultado exibido em painel lateral: lista de riscos com severidade (alta, média, baixa) e sugestão de correção.

* Cada sugestão pode ser aplicada diretamente no contrato ou ignorada manualmente.

|   TELA  Detalhe do contrato |
| :---- |

| Visualização completa do contrato |
| :---- |

Exibe o contrato com todos os dados preenchidos, status atual e histórico de versões.

* Painel de status com timeline: criação → revisões → envio → assinaturas → conclusão.

* Indicadores de assinatura por parte: quem já assinou, quem está pendente, data de cada assinatura.

| Histórico de versões |
| :---- |

Lista de todas as versões geradas por edições, alterações ou aditivos.

* Cada versão mostra data, autor da alteração e motivo.

* Comparação entre duas versões selecionadas: diferenças destacadas campo a campo.

| Enviar para assinatura |
| :---- |

Dispara o contrato para todas as partes assinarem.

* O sistema envia e-mail com o modelo selecionado e mensagem de WhatsApp com link direto para cada assinante.

* Cada assinante recebe um link único e intransferível.

| Reenviar lembretes |
| :---- |

Reenvia manualmente o link de assinatura para os assinantes pendentes.

* Disponível para contratos com status 'Em assinatura'.

| Cancelar contrato |
| :---- |

Cancela o contrato manualmente com registro de motivo.

* Disponível para contratos que ainda não foram totalmente assinados.

| Arquivar contrato |
| :---- |

Move o contrato para o arquivo morto após encerramento.

* Contrato arquivado não pode ser editado, apenas consultado.

| Download do PDF |
| :---- |

Download do PDF do contrato.

* Para contratos assinados: PDF final com página de evidências.

* Para contratos em rascunho ou revisão: PDF de prévia sem evidências.

|   TELA  Alterações e negociação |
| :---- |

| Visualizar solicitações de alteração |
| :---- |

Lista todas as solicitações de alteração abertas e o histórico de rodadas.

* Cada solicitação exibe: cláusula referenciada, justificativa do contratante, data e status (pendente, respondida, aceita, negada).

| Responder solicitação |
| :---- |

Ações disponíveis para cada solicitação recebida do contratante.

* Aceitar: aplica a alteração ao contrato e gera nova versão.

* Negar: registra negativa com justificativa opcional.

* Sugerir contraproposta: campo de texto com a versão alternativa proposta pela contratada.

| Histórico de rodadas |
| :---- |

Exibe o encadeamento completo de propostas e respostas em ordem cronológica.

* Sem limite de rodadas — negociação segue até ambas as partes aprovarem a versão corrente.

|   TELA  Aditivos contratuais |
| :---- |

| Criar aditivo |
| :---- |

Disponível para contratos com status 'Assinado'. Inicia o fluxo de criação de aditivo.

* Campos alteráveis via aditivo: valor, prazo, objeto, cláusulas específicas.

* Demais campos do contrato original ficam bloqueados para edição.

| Referência cruzada automática |
| :---- |

O sistema vincula automaticamente o aditivo ao contrato original.

* PDF do aditivo menciona número e data do contrato original.

* Contrato original exibe lista de aditivos vinculados com links de acesso.

| Fluxo de assinatura do aditivo |
| :---- |

O aditivo segue o mesmo fluxo de envio, negociação e assinatura do contrato original.

* Todas as partes originais são notificadas e precisam assinar.

* PDF final do aditivo gerado com página de evidências.

| MÓDULO 03  Análise de contratos externos |
| :---- |

|   TELA  Análise de contrato externo |
| :---- |

| Importar contrato |
| :---- |

Entrada do contrato a ser analisado.

* Upload de arquivo PDF ou Word (.docx).

* Colagem de texto livre no campo de entrada.

| Definir contexto de análise |
| :---- |

Seleção do papel da empresa no contrato recebido.

* Opções: 'Somos a contratada' ou 'Somos a contratante'.

* O contexto define o foco da análise da IA — riscos relevantes mudam conforme o papel.

| Análise de riscos pela IA |
| :---- |

A IA processa o contrato e retorna um relatório de riscos.

* Riscos classificados por severidade: alta, média, baixa.

* Cada risco exibe: cláusula de origem, descrição do problema e impacto potencial.

| Sugestões de alteração |
| :---- |

Com base nos riscos encontrados, a IA sugere alterações a serem solicitadas à outra parte.

* Cada sugestão pode ser aceita, editada manualmente ou descartada.

| Comparação com modelos internos |
| :---- |

Compara o contrato externo com os modelos de contrato cadastrados na plataforma.

* Exibe pontos de divergência entre o contrato externo e o modelo interno selecionado.

* Auxilia a identificar cláusulas ausentes ou com redação diferente do padrão da empresa.

| Edição manual do relatório |
| :---- |

Todos os resultados da análise podem ser editados livremente antes de exportar.

| Exportar relatório |
| :---- |

Exporta o relatório de análise em PDF para uso externo ou arquivo interno.

| MÓDULO 04  Landing page do contratante |
| :---- |

*Acessível via link único enviado por e-mail e WhatsApp. Não requer cadastro prévio na plataforma.*

|   TELA  Visualização e leitura do contrato |
| :---- |

| Exibição do contrato completo |
| :---- |

Renderização do contrato em formato legível com todas as cláusulas, anexos e dados das partes.

* Leitura obrigatória: botão de ação fica desabilitado até o contratante rolar até o final do documento.

* Coleta de evidências iniciada no momento do acesso: IP, data/hora, navegador, sistema operacional, token do link.

* Registro de timestamp quando o scroll chega ao final — confirmação de leitura.

| Análise por cláusula |
| :---- |

O contratante pode interagir com cada cláusula individualmente.

* Botão de OK por cláusula para sinalizar concordância.

* Campo para adicionar ressalva ou comentário em cláusula específica.

|   TELA  Decisão e ação do contratante |
| :---- |

| Aprovar para assinatura |
| :---- |

O contratante confirma a aprovação do contrato.

* Ao aprovar, o sistema dispara automaticamente o código de assinatura por e-mail para todas as partes simultaneamente.

* Status do contrato muda para 'Em assinatura'.

| Solicitar alterações |
| :---- |

O contratante abre uma solicitação de alteração para uma ou mais cláusulas.

* Campos: cláusula referenciada e justificativa/texto da alteração desejada.

* A contratada recebe notificação e pode aceitar, negar ou sugerir contraproposta.

* Rodadas de negociação sem limite de iterações.

| Recusar o contrato |
| :---- |

O contratante recusa totalmente o contrato com registro de motivo.

* A contratada recebe notificação imediata com o motivo da recusa.

* Status do contrato muda para 'Cancelado'.

|   TELA  Assinatura eletrônica |
| :---- |

| Inserção do código de assinatura |
| :---- |

Após aprovação do contrato, o contratante recebe um código por e-mail.

* Campo para inserção do código na landing page.

* Código com prazo de expiração vinculado ao prazo de assinatura configurado no contrato.

* Ao inserir o código com sucesso, a assinatura é registrada com todas as evidências coletadas.

| Confirmação de assinatura |
| :---- |

Após assinatura bem-sucedida, exibe tela de confirmação.

* Informa se há outras partes ainda pendentes de assinatura.

* Quando todas as partes assinarem, o PDF final é enviado automaticamente por e-mail para todos os assinantes e testemunhas.

| MÓDULO 05  Evidências e PDF final |
| :---- |

|   TELA  Visualização de evidências do contrato |
| :---- |

| Painel de evidências por assinante |
| :---- |

Exibe o conjunto completo de evidências coletadas de cada assinante.

* E-mail confirmado, IP de acesso, data e hora (UTC), navegador, sistema operacional.

* Token único do link, hash SHA-256 do documento, registro de abertura e timestamp de leitura completa.

* Aceite dos termos com timestamp e código de assinatura utilizado.

| Log de auditoria interna |
| :---- |

Registra todas as ações realizadas sobre o contrato dentro da plataforma.

* Ações registradas: criação, edições, visualizações, envios, downloads e exportações.

* Cada registro exibe: usuário, ação, data e hora.

* Acesso restrito a usuários com permissão de administrador.

|   TELA  PDF final assinado |
| :---- |

| Geração automática do PDF |
| :---- |

PDF gerado automaticamente quando todas as partes assinam dentro do prazo.

* Conteúdo: contrato completo com dados preenchidos \+ todos os anexos \+ página final de evidências.

* A página de evidências lista cada assinante com seus respectivos dados coletados.

* Hash do documento registrado no PDF para verificação de integridade posterior.

| Envio automático |
| :---- |

O PDF final é enviado por e-mail automaticamente para todas as partes.

* Destinatários: contratante, representante da contratada e todas as testemunhas cadastradas.

| Armazenamento na plataforma |
| :---- |

PDF armazenado no sistema vinculado ao contrato para consulta futura.

* Armazenamento imutável — o arquivo não pode ser alterado após geração.

* Download disponível a qualquer momento para usuários com permissão.

* Retenção conforme política configurada pelo administrador.

| MÓDULO 06  Permissões de usuário |
| :---- |

*Gerenciadas no cadastro de usuários já existente no software. As permissões abaixo são aplicadas a este módulo.*

|   TELA  Configuração de permissões por usuário |
| :---- |

| Permissões do módulo de contratos |
| :---- |

Granularidade de acesso sugerida para este módulo:

* Criar contrato: criar novos contratos e rascunhos.

* Editar contrato: editar contratos em rascunho ou em revisão.

* Enviar para assinatura: disparar o contrato para as partes.

* Gerenciar modelos: criar e editar modelos de contrato e e-mail.

* Visualizar contratos: acesso somente leitura, sem edição.

* Analisar contratos externos: acesso ao módulo de análise de terceiros.

* Acessar evidências: visualizar log de evidências e auditoria.

* Administrador do módulo: acesso total incluindo configurações de retenção e auditoria.

| MÓDULO 07  Integrações |
| :---- |

|   TELA  Integrações utilizadas pelo módulo |
| :---- |

| WhatsApp |
| :---- |

Integração direta já existente no software.

* Envio do link de contrato ao contratante no momento do disparo.

* Envio de lembretes automáticos para assinantes pendentes conforme frequência configurada.

| CRM — Advisor (mestresdaweb.com.br) |
| :---- |

Integração com o CRM para importação do escopo do cliente.

* Busca por cliente e listagem dos escopos disponíveis.

* Escopo selecionado inserido automaticamente como ANEXO 1 no contrato.

| E-mail |
| :---- |

Envio transacional em todos os eventos do fluxo.

* Envio do contrato para assinatura com modelo de e-mail configurado.

* Envio do código de assinatura para cada parte.

* Envio de lembretes de assinatura.

* Envio do PDF final assinado para todos os destinatários.

*— fim do documento —*