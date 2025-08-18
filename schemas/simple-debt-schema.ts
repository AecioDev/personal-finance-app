import { z } from "zod";

export const SimpleDebtFormSchema = z
  .object({
    name: z.string().min(3, "A descrição deve ter pelo menos 3 caracteres."),
    categoryId: z.string().min(1, "Selecione uma categoria."),
    dueDate: z.date({ required_error: "A data de vencimento é obrigatória." }),
    amount: z.coerce
      .number({ invalid_type_error: "O valor deve ser um número" })
      .positive("O valor deve ser maior que zero."),
    isRecurring: z.boolean().default(false).optional(),
    payNow: z.boolean().default(false).optional(),
    accountId: z.string().optional(),
    paymentMethodId: z.string().optional(),
  })
  // VALIDAÇÃO CONDICIONAL
  .superRefine((data, ctx) => {
    if (data.payNow) {
      if (!data.accountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Selecione uma conta.",
          path: ["accountId"],
        });
      }
      if (!data.paymentMethodId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Selecione um método.",
          path: ["paymentMethodId"],
        });
      }
    }
  });

export type SimpleDebtFormData = z.infer<typeof SimpleDebtFormSchema>;
