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
  categoryId: z.string().min(1, "Selecione uma categoria."),
  notes: z.string().optional(),
  // Continuam opcionais aqui, pois a regra é condicional
  accountId: z.string().optional(),
  paymentMethodId: z.string().optional(),
});

// Schema para o lançamento "Direto" (sem o .superRefine aqui)
const singleEntrySchema = baseSchema.extend({
  entryFrequency: z.literal("single"),
  dueDate: z.date({ required_error: "A data de vencimento é obrigatória." }),
  payNow: z.boolean().default(false),
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
    // A regra só se aplica se a frequência for 'single'
    if (data.entryFrequency === "single" && data.payNow) {
      // ...então 'accountId' precisa ser uma string com pelo menos 1 caractere.
      if (!data.accountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "A conta é obrigatória.",
          path: ["accountId"],
        });
      }
      // ...e 'paymentMethodId' também precisa ser uma string com pelo menos 1 caractere.
      if (!data.paymentMethodId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "O meio de pagamento é obrigatório.",
          path: ["paymentMethodId"],
        });
      }
    }
  });

// O tipo do nosso formulário agora é inferido a partir dessa união de schemas
export type FinancialEntryFormData = z.infer<typeof FinancialEntrySchema>;
