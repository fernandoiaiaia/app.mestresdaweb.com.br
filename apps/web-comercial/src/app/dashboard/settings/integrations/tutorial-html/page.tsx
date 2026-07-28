"use client";

import React, { useState } from "react";
import { Copy, CheckCircle2, ChevronLeft, Webhook, Code, Terminal, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function HTMLTutorialPage() {
    const [copied, setCopied] = useState<string | null>(null);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const htmlCode = `<form id="meu-formulario-lead">
  <!-- OBRIGATÓRIO -->
  <label for="nome">Nome Completo *</label>
  <input type="text" id="nome" required>

  <!-- OPCIONAL MAS RECOMENDADO -->
  <label for="email">E-mail Corporativo</label>
  <input type="email" id="email">

  <label for="telefone">WhatsApp / Telefone</label>
  <input type="tel" id="telefone">

  <button type="submit">Solicitar Orçamento</button>
</form>`;

    const jsCode = `document.getElementById('meu-formulario-lead').addEventListener('submit', async function (event) {
  event.preventDefault(); // Impede a página de recarregar

  // 1. Capture os dados do formulário
  const nome = document.getElementById('nome').value;
  const email = document.getElementById('email').value;
  const telefone = document.getElementById('telefone').value;

  // 2. Monte o objeto exato que o CRM precisa (Obrigatório: apenas name)
  const payload = {
    name: nome,
    email: email,
    phone: telefone,
    source: "Site Oficial - Contato Direto" // De onde veio esse Lead?
  };

  try {
    // 3. Modifique esta URL e TOKEN com os seus dados reais!
    const WEBHOOK_URL = "SUA_URL_AQUI_CRIADA_NO_PAINEL";
    const SECRET_TOKEN = "SEU_TOKEN_AQUI";

    // 4. Faça a requisição HTTP POST
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${SECRET_TOKEN}\`
      },
      body: JSON.stringify(payload)
    });

    // 5. Verifique se deu tudo certo
    if (response.ok) {
      alert("Recebemos seu contato com sucesso! Entraremos em contato em breve.");
      document.getElementById('meu-formulario-lead').reset(); // Limpa o form
    } else {
      console.error("Erro ao enviar:", await response.json());
      alert("Houve um problema ao enviar seu contato. Tente novamente.");
    }
  } catch (error) {
    console.error("Erro na conexão:", error);
    alert("Erro na conexão. Verifique sua internet.");
  }
});`;

    const advancedPayloadCode = `const payloadAvancado = {
  // Dados do Contato
  name: "Carlos Programador", // (OBRIGATÓRIO)
  email: "carlos@tecnobio.com.br",
  phone: "11999998888",
  role: "CEO", // Cargo
  
  // Dados para popular o CARD de Vendas (Deal)
  dealTitle: "Implantação de E-commerce", // Título no kanban
  dealValue: 15000,                       // Valor em R$
  notes: "Lead pediu urgência. Prefere contato via WhatsApp.",
  source: "Formulário de Orçamentos - Landing Page",
  
  // Dados da Empresa do Contato
  companyName: "TecnoBio Inovações",
  companyCnpj: "44.555.666/0001-99"
};`;

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto min-h-screen pb-20 text-slate-300">
            {/* Header */}
            <div className="mb-8">
                <Link href="/dashboard/settings/integrations/inbound_webhook" className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors text-sm mb-6 w-fit">
                    <ChevronLeft size={16} /> Voltar para o Webhook
                </Link>
                
                <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#E34F26]/10 border border-[#E34F26]/20 flex items-center justify-center shrink-0">
                        <Code size={24} className="text-[#E34F26]" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Tutorial: Integar HTML Personalizado</h1>
                        <p className="text-slate-400 mt-1">Aprenda a conectar qualquer site feito com puro HTML/JS à Pipeline de Vendas pelo Inbound Webhook.</p>
                    </div>
                </div>
            </div>

            {/* Warning */}
            <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl mb-8 flex items-start gap-4">
                <AlertCircle size={24} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-sm font-bold text-amber-500 mb-1">Aviso de Segurança Frontend</h4>
                    <p className="text-xs text-amber-500/80 leading-relaxed">
                        Como este código JavaScript rodará diretamente no navegador do cliente, <strong>qualquer pessoa poderá inspecionar e visualizar o seu Token de Segurança</strong> nas requisições de rede (F12). Recomendamos sempre que possível disparar o comando para o seu próprio *Backend* (PHP, Node, Python) e ele se encarregar de repassar para o nosso Webhook ocultando a chave. Caso seu site não tenha backend, o script funcionará normalmente, apenas esteja ciente da exposição mecânica do token.
                    </p>
                </div>
            </div>

            <div className="grid gap-8">
                
                {/* Step 1 */}
                <section className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">1</div>
                        <h2 className="text-lg font-bold text-white">Criando o Formulário HTML</h2>
                    </div>
                    <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                        No seu site, você deve possuir um formulário simples. É obrigatório que os campos possuam um <code className="text-blue-300">id</code> para podermos capturar o que o usuário digitou via identificador. Pelo menos o campo "Nome" deve ser exigido do cliente!
                    </p>

                    <div className="relative group">
                        <div className="absolute top-3 right-3">
                            <button onClick={() => copyToClipboard(htmlCode, "html")} className="p-2 rounded-lg bg-slate-800 border border-white/10 text-slate-400 hover:text-white transition">
                                {copied === "html" ? <CheckCircle2 size={14} className="text-green-400" /> : <Copy size={14} />}
                            </button>
                        </div>
                        <pre className="bg-[#0D1117] border border-white/5 p-5 rounded-xl overflow-x-auto text-xs font-mono text-slate-300">
                            <code>{htmlCode}</code>
                        </pre>
                    </div>
                </section>

                {/* Step 2 */}
                <section className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">2</div>
                        <h2 className="text-lg font-bold text-white">O Script de Conexão com a Fetch API</h2>
                    </div>
                    <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                        Coloque o script abaixo logo antes do fechamento da sua tag <code className="text-blue-300">&lt;/body&gt;</code> ou no seu banco de scripts global. O script "escutará" quando o cliente engatilhar a requisição, formata os dados e envia para cá através da interface Fetch. 
                        <strong>Lembre-se de alterar as linhas de URL_WEBHOOK e SECRET_TOKEN!</strong>
                    </p>

                    <div className="relative group">
                        <div className="absolute top-3 right-3">
                            <button onClick={() => copyToClipboard(jsCode, "js")} className="p-2 rounded-lg bg-slate-800 border border-white/10 text-slate-400 hover:text-white transition">
                                {copied === "js" ? <CheckCircle2 size={14} className="text-green-400" /> : <Copy size={14} />}
                            </button>
                        </div>
                        <pre className="bg-[#0D1117] border border-white/5 p-5 rounded-xl overflow-x-auto text-xs font-mono text-[#E2C08D]">
                            <code>{jsCode}</code>
                        </pre>
                    </div>
                </section>

                {/* Step 3 */}
                <section className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">3</div>
                        <h2 className="text-lg font-bold text-white">Campos Avançados (Enviando pro Deal)</h2>
                    </div>
                    <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                        Se o seu formulário for maior e captar dados complexos, é legal que você já envie todos os dados contextuais para criarmos uma **Oportunidade (Deal)** perfeitamente estruturada para o vendedor abrir no Kanban. Adapte as consts capturadas e adicione eles ao "Payload":
                    </p>

                    <div className="relative group">
                        <div className="absolute top-3 right-3">
                            <button onClick={() => copyToClipboard(advancedPayloadCode, "adv")} className="p-2 rounded-lg bg-slate-800 border border-white/10 text-slate-400 hover:text-white transition">
                                {copied === "adv" ? <CheckCircle2 size={14} className="text-green-400" /> : <Copy size={14} />}
                            </button>
                        </div>
                        <pre className="bg-[#0D1117] border border-white/5 p-5 rounded-xl overflow-x-auto text-xs font-mono text-[#E2C08D]">
                            <code>{advancedPayloadCode}</code>
                        </pre>
                    </div>
                </section>

                {/* Troubleshooting */}
                <section className="border border-white/[0.06] rounded-2xl p-6 md:p-8 bg-slate-900/50">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4"><Terminal size={16} className="text-blue-400" /> Solução de Problemas Comuns</h3>
                    <ul className="space-y-4 text-sm text-slate-400">
                        <li className="flex items-start gap-2">
                            <span className="text-red-400 font-bold shrink-0">Erro 401:</span> 
                            <span>Seu token está incorreto! Confirme se no header da requisição, a palavra "Bearer" tem um espaço antes do código do seu token e se o token é exatamente o mesmo cadastrado.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-red-400 font-bold shrink-0">Erro CORS:</span> 
                            <span>Nosso webhook aceita conexões globais (*). Se o DevTools acusou CORS, seu script possui algum erro de digitação bizarro na marcação da URL.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-amber-400 font-bold shrink-0">Cadastrou, mas sumiu do Funil:</span> 
                            <span>O Contato foi criado com sucesso, porém você não selecionou nenhum Vendedor Responsável como *Round-Robin* no painel do Webhook. Sem dono, o lead morre afogado no limbo sem vendedor designado. Volte lá e marque pelo menos você!</span>
                        </li>
                    </ul>
                </section>

            </div>
        </div>
    );
}
