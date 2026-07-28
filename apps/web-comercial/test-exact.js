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

const gExact = (row, exactKeys) => {
    const k = Object.keys(row).find(k => exactKeys.includes(k.toLowerCase().trim()));
    return k ? String(row[k]).trim() : undefined;
};

const gPrefix = (row, prefixes) => {
    const k = Object.keys(row).find(k => prefixes.some(p => k.toLowerCase().trim().startsWith(p)));
    return k ? String(row[k]).trim() : undefined;
};

console.log("Client Name:", gExact(row, ["nome completo (pessoa)", "nome completo", "cliente", "contato"]) || gPrefix(row, ["nome completo", "cliente"]));
console.log("Client Email:", gExact(row, ["e-mail (pessoa)", "e-mail", "email"]));
console.log("Consultant Name:", gExact(row, ["nome do dono da oportunidade", "dono", "responsável", "consultor", "vendedor"]));
console.log("Deal Title:", gExact(row, ["título", "titulo", "oportunidade", "negócio"]));
console.log("Deal Source:", gExact(row, ["origem", "source", "canal"]));

