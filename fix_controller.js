const fs = require('fs');
const file = 'apps/api/src/modules/financial/credit-cards.controller.ts';
let code = fs.readFileSync(file, 'utf8');

const injection = `
    // PUT /api/financial/cards/:id/expenses/:expenseId
    async updateExpense(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) return res.status(401).json({ error: "Unauthorized" });

            const { id: cardId, expenseId } = req.params as { id: string; expenseId: string };
            const data = req.body;
            
            const updatedExpense = await service.updateExpense(userId, cardId, expenseId, data);
            return res.json({ success: true, data: updatedExpense });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: { message: error.message } });
        }
    }

    // DELETE /api/financial/cards/:id/expenses/:expenseId`;

code = code.replace('    // DELETE /api/financial/cards/:id/expenses/:expenseId', injection);

fs.writeFileSync(file, code);
