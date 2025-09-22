import { z } from "zod";

// Base com os campos que TODOS os tipos de lançamento têm
const baseSchema = z.object({
  description: z
    .string()
    .min(3, "A descrição deve ter pelo menos 3 caracteres."),
  expectedAmount: z
    .number({ invalid_type_error: "O valor é obrigatório." })
    .positive("O valor deve ser maior que zero."),
  type: z.enum(["income", "expense"]),
  // --- ALTERAÇÃO 1: Tornamos o campo opcional na base ---
  categoryId: z.string().optional(),
  notes: z.string().optional(),
  accountId: z.string().optional(),
  paymentMethodId: z.string().optional(),
});

// Schema para o lançamento "Direto"
const singleEntrySchema = baseSchema.extend({
  entryFrequency: z.literal("single"),
  dueDate: z.date({ required_error: "A data de vencimento é obrigatória." }),
  payNow: z.boolean().default(false),
  paymentDate: z.date().optional(),
});

// Schema para o lançamento "Parcelado"
const installmentEntrySchema = baseSchema.extend({
  entryFrequency: z.literal("installment"),
  startDate: z.date({ required_error: "A data da 1ª parcela é obrigatória." }),
  totalInstallments: z.coerce
    .number({ invalid_type_error: "Informe o número de parcelas." })
    .min(2, "O mínimo são 2 parcelas."),
});

// Schema para os lançamentos "Recorrentes"
const recurringEntrySchema = baseSchema.extend({
  entryFrequency: z.enum(["monthly", "weekly", "yearly"]),
  startDate: z.date({ required_error: "A data de início é obrigatória." }),
});

// O Zod vai validar o formulário usando um desses schemas, baseado no valor de 'entryFrequency'
export const FinancialEntrySchema = z
  .discriminatedUnion("entryFrequency", [
    singleEntrySchema,
    installmentEntrySchema,
    recurringEntrySchema,
  ])
  .superRefine((data, ctx) => {
    // Regra 1: Validação para pagamento imediato (sua lógica original)
    if (data.entryFrequency === "single" && data.payNow) {
      if (!data.accountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "A conta é obrigatória.",
          path: ["accountId"],
        });
      }
      if (!data.paymentMethodId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "O meio de pagamento é obrigatório.",
          path: ["paymentMethodId"],
        });
      }
    }

    // Regra 2: Categoria é obrigatória para Despesa e Receita neste formulário.
    if (!data.categoryId || data.categoryId.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecione uma categoria.",
        path: ["categoryId"],
      });
    }
  });

// O tipo do nosso formulário agora é inferido a partir dessa união de schemas
export type FinancialEntryFormData = z.infer<typeof FinancialEntrySchema>;
