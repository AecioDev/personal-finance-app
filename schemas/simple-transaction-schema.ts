import { z } from "zod";

// Schema de validação para o formulário
export const SimpleTransactionSchema = z.object({
  description: z.string().min(3, "A descrição é obrigatória."),
  amount: z.coerce.number().positive("O valor deve ser maior que zero."),
  date: z.date({ required_error: "A data é obrigatória." }),
  type: z.enum(["income", "expense"]),
  categoryId: z.string().min(1, "Selecione uma categoria."),
  accountId: z.string().min(1, "Selecione uma conta."),
});

export type SimpleTransactionFormData = z.infer<typeof SimpleTransactionSchema>;
