import { z } from "zod";

export const debtSchema = z
  .object({
    description: z
      .string()
      .min(3, "A descrição deve ter pelo menos 3 caracteres."),
    originalAmount: z.number().positive("O valor original deve ser positivo."),
    totalRepaymentAmount: z.number().nullable().optional(),

    type: z.string().min(1, "O tipo de dívida é obrigatório."),
    isRecurring: z.boolean(),
    totalInstallments: z.number().nullable(),
    expectedInstallmentAmount: z.number().nullable(),
    interestRate: z.number().nullable(),
    fineRate: z.number().nullable(),
    startDate: z.date({
      required_error: "A data de início é obrigatória.",
      invalid_type_error: "Formato de data inválido.",
    }),
    endDate: z.date().nullable(),
  })
  .refine(
    (data) => {
      if (data.endDate && data.startDate > data.endDate) {
        return false;
      }
      return true;
    },
    {
      message: "A data de término não pode ser anterior à data de início.",
      path: ["endDate"],
    }
  );

export type DebtFormData = z.infer<typeof debtSchema>;
