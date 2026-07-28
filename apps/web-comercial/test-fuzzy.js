const row = {
    "Etapa": "SAL",
    "Lead/Timing da etapa": "Morno",
    "Dados da oportunidade": "vendedor@mestresdaweb.com.br",
    "Nome do dono da oportunidade": "Duda Cruz",
    "Origem": "Googleads",
    "Data do cadastro": "01/01/2025",
    "Data de fechamento": "10/01/2025",
    "Lead/Timing": "Morno",
    "Título": "Oportunidade XYZ",
    "Valor": "R$ 10.000,00",
    "Tags": "Tag1, Tag2",
    "Nome completo (Pessoa)": "João Silva",
    "E-mail (Pessoa)": "joao@cliente.com"
};

const g = (row, keys) => {
    const k = Object.keys(row).find(k => keys.some(key => k.toLowerCase().trim().includes(key)));
    return k ? String(row[k]).trim() : undefined;
};

console.log("Client Name:", g(row, ["nome completo", "nome", "name", "cliente", "contato", "pessoa"]));
console.log("Client Email:", g(row, ["e-mail", "email"]));
console.log("Consultant Name:", g(row, ["dono", "responsável", "responsavel", "consultor", "vendedor", "owner"]));
console.log("Deal Title:", g(row, ["título", "titulo", "title", "oportunidade", "negócio", "negocio"]));

