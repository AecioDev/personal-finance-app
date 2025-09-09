// in: schemas/financial-entry-schema.ts

import { z } from "zod";

export const FinancialEntrySchema = z
  .object({
    description: z
      .string()
      .min(3, { message: "A descrição deve ter pelo menos 3 caracteres." }),

    expectedAmount: z.coerce
      .number({ invalid_type_error: "O valor deve ser um número." })
      .positive({ message: "O valor deve ser maior que zero." }),

    dueDate: z.date({
      required_error: "A data de vencimento é obrigatória.",
    }),

    type: z.enum(["income", "expense"]),

    categoryId: z.string().min(1, { message: "Selecione uma categoria." }),

    // --- NOVA LÓGICA DE CONTROLE ---
    entryFrequency: z
      .enum(["single", "recurring", "installment"])
      .default("single"),

    payNow: z.boolean().default(false),

    // --- CAMPOS QUE AGORA SÃO CONDICIONAIS ---
    totalInstallments: z.coerce.number().int().optional(),
    accountId: z.string().optional(),
    paymentMethodId: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      // Se for "Parcelado", o total de parcelas é obrigatório
      if (data.entryFrequency === "installment") {
        return data.totalInstallments && data.totalInstallments > 1;
      }
      return true;
    },
    {
      message: "Para um lançamento parcelado, informe 2 ou mais parcelas.",
      path: ["totalInstallments"],
    }
  )
  .refine(
    (data) => {
      // Se "Pagar Agora" estiver marcado, a conta é obrigatória
      if (data.payNow) {
        return !!data.accountId;
      }
      return true;
    },
    {
      message: "Selecione a conta para efetuar o pagamento.",
      path: ["accountId"],
    }
  );

export type FinancialEntryFormData = z.infer<typeof FinancialEntrySchema>;
