const fs = require('fs');
const file = 'apps/Web-admin/src/app/dashboard/financial/cards/[id]/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// Add imports
code = code.replace(
    'import { ChevronLeft, Plus, Loader2, CreditCard as CardIcon, Trash2, Calendar, DollarSign, Lock, X } from "lucide-react";',
    'import { ChevronLeft, Plus, Loader2, CreditCard as CardIcon, Trash2, Calendar, DollarSign, Lock, X, Edit, Pencil } from "lucide-react";'
);

// Add states
const stateInjection = `
    const [isEditCardModalOpen, setIsEditCardModalOpen] = useState(false);
    const [isEditingCard, setIsEditingCard] = useState(false);
    const [editCardName, setEditCardName] = useState("");
    const [editCardBrand, setEditCardBrand] = useState("");
    const [editCardLimit, setEditCardLimit] = useState("");
    const [editCardClosingDay, setEditCardClosingDay] = useState("");
    const [editCardDueDay, setEditCardDueDay] = useState("");
    const [editCardColor, setEditCardColor] = useState("blue");

    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [editDescription, setEditDescription] = useState("");
    const [editCategory, setEditCategory] = useState("");
    const [editValue, setEditValue] = useState("");
    const [isUpdatingExpense, setIsUpdatingExpense] = useState(false);
`;

code = code.replace(
    'const [isAddingExpense, setIsAddingExpense] = useState(false);',
    'const [isAddingExpense, setIsAddingExpense] = useState(false);' + stateInjection
);

// Add handler functions
const handlersInjection = `
    const openEditCardModal = () => {
        if (!card) return;
        setEditCardName(card.name);
        setEditCardBrand(card.brand || "Mastercard");
        setEditCardLimit(card.limit ? card.limit.toString() : "");
        setEditCardClosingDay(card.closingDay.toString());
        setEditCardDueDay(card.dueDay.toString());
        setEditCardColor(card.color || "blue");
        setIsEditCardModalOpen(true);
    };

    const handleUpdateCard = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsEditingCard(true);
            const res = await api(\`/api/financial/cards/\${cardId}\`, {
                method: "PUT",
                body: {
                    name: editCardName,
                    brand: editCardBrand,
                    limit: editCardLimit ? parseFloat(editCardLimit.replace(/\\./g, '').replace(',', '.')) : null,
                    closingDay: parseInt(editCardClosingDay),
                    dueDay: parseInt(editCardDueDay),
                    color: editCardColor
                }
            });

            if (res.success) {
                toast.success("Cartão atualizado com sucesso!");
                setIsEditCardModalOpen(false);
                loadCard();
            } else {
                toast.error("Erro ao atualizar cartão");
            }
        } catch {
            toast.error("Erro interno ao atualizar cartão");
        } finally {
            setIsEditingCard(false);
        }
    };

    const openEditExpenseModal = (expense: Expense) => {
        setEditingExpense(expense);
        setEditDescription(expense.description);
        setEditCategory(expense.category);
        setEditValue(expense.value.toString().replace('.', ','));
    };

    const handleUpdateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingExpense) return;
        try {
            setIsUpdatingExpense(true);
            const parsedValue = parseFloat(editValue.replace(/\\./g, '').replace(',', '.'));
            
            const res = await api(\`/api/financial/cards/\${cardId}/expenses/\${editingExpense.id}\`, {
                method: "PUT",
                body: {
                    description: editDescription,
                    category: editCategory,
                    value: parsedValue
                }
            });

            if (res.success) {
                toast.success("Despesa atualizada com sucesso!");
                setEditingExpense(null);
                loadCard();
            } else {
                toast.error("Erro ao atualizar despesa");
            }
        } catch {
            toast.error("Erro interno ao atualizar despesa");
        } finally {
            setIsUpdatingExpense(false);
        }
    };
`;

code = code.replace(
    'const handleAddExpense = async (e: React.FormEvent) => {',
    handlersInjection + '\n    const handleAddExpense = async (e: React.FormEvent) => {'
);

// Inject Edit Card button
code = code.replace(
    '<h1 className="text-2xl font-bold text-white flex items-center gap-2">\n                    {card.name} <span className="text-sm font-normal text-slate-500">({card.brand})</span>\n                </h1>',
    `<h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    {card.name} <span className="text-sm font-normal text-slate-500">({card.brand})</span>
                    <button onClick={openEditCardModal} className="text-slate-400 hover:text-white transition-colors ml-2"><Pencil size={18} /></button>
                </h1>`
);

// Inject Edit Expense button
code = code.replace(
    '<Trash2 size={16} />\n                                                                </button>\n                                                            )}',
    `<Trash2 size={16} />
                                                                </button>
                                                            )}
                                                            {invoice.status === 'open' && (
                                                                <button 
                                                                    onClick={() => openEditExpenseModal(expense)}
                                                                    className="text-slate-500 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all"
                                                                >
                                                                    <Edit size={16} />
                                                                </button>
                                                            )}`
);

// Add Modals at the end (before last </div>)
const modalsInjection = `
            {/* Modal Editar Cartão */}
            <AnimatePresence>
                {isEditCardModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-white/5">
                                <h2 className="text-xl font-semibold text-white">Editar Cartão</h2>
                                <button onClick={() => setIsEditCardModalOpen(false)} className="text-slate-400 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleUpdateCard} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Nome do Cartão</label>
                                    <input type="text" required value={editCardName} onChange={e => setEditCardName(e.target.value)}
                                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Bandeira</label>
                                        <select value={editCardBrand} onChange={e => setEditCardBrand(e.target.value)}
                                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none">
                                            <option value="Mastercard">Mastercard</option>
                                            <option value="Visa">Visa</option>
                                            <option value="Elo">Elo</option>
                                            <option value="Amex">Amex</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Cor</label>
                                        <select value={editCardColor} onChange={e => setEditCardColor(e.target.value)}
                                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none">
                                            <option value="purple">Roxo</option>
                                            <option value="orange">Laranja</option>
                                            <option value="blue">Azul</option>
                                            <option value="black">Preto</option>
                                            <option value="green">Verde</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Fechamento</label>
                                        <input type="number" min="1" max="31" required value={editCardClosingDay} onChange={e => setEditCardClosingDay(e.target.value)}
                                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Vencimento</label>
                                        <input type="number" min="1" max="31" required value={editCardDueDay} onChange={e => setEditCardDueDay(e.target.value)}
                                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Limite</label>
                                    <input type="text" placeholder="Opcional" value={editCardLimit} onChange={e => setEditCardLimit(e.target.value)}
                                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none" />
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setIsEditCardModalOpen(false)} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-700">Cancelar</button>
                                    <button type="submit" disabled={isEditingCard} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500">
                                        {isEditingCard ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Salvar"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Editar Despesa */}
            <AnimatePresence>
                {editingExpense && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-white/5">
                                <h2 className="text-xl font-semibold text-white">Editar Despesa</h2>
                                <button onClick={() => setEditingExpense(null)} className="text-slate-400 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleUpdateExpense} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Descrição</label>
                                    <input type="text" required value={editDescription} onChange={e => setEditDescription(e.target.value)}
                                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Categoria</label>
                                        <select value={editCategory} onChange={e => setEditCategory(e.target.value)}
                                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none">
                                            <option value="Alimentação">Alimentação</option>
                                            <option value="Transporte">Transporte</option>
                                            <option value="Software / SaaS">Software / SaaS</option>
                                            <option value="Infraestrutura / Cloud">Infraestrutura</option>
                                            <option value="Materiais de Escritório">Materiais</option>
                                            <option value="Outros">Outros</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Valor Total (R$)</label>
                                        <input type="text" required value={editValue} onChange={e => setEditValue(e.target.value)}
                                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none" />
                                    </div>
                                </div>
                                <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg text-xs text-yellow-200/80 mt-2">
                                    Atenção: Edição permitida apenas para descrição e valor. Para mudar data ou parcelas, exclua o lançamento.
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setEditingExpense(null)} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-700">Cancelar</button>
                                    <button type="submit" disabled={isUpdatingExpense} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500">
                                        {isUpdatingExpense ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Salvar"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
`;

code = code.replace(/<\/div>\n    \);\n}\n$/, modalsInjection + '\n        </div>\n    );\n}\n');

fs.writeFileSync(file, code);
console.log('Modified [id]/page.tsx successfully');
