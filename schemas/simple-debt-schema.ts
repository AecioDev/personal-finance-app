// src/schemas/simple-debt-schema.ts
import { z } from "zod";

export const SimpleDebtFormSchema = z.object({
  name: z.string().min(3, "A descrição deve ter pelo menos 3 caracteres."),
  categoryId: z.string().min(1, "Selecione uma categoria."),
  dueDate: z.date({ required_error: "A data de vencimento é obrigatória." }),
  amount: z.coerce
    .number({ invalid_type_error: "O valor deve ser um número" })
    .positive("O valor deve ser maior que zero."),
});

export type SimpleDebtFormData = z.infer<typeof SimpleDebtFormSchema>;
