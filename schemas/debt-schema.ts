import { z } from "zod";
import { Debt } from "../interfaces/finance";

// Função auxiliar para preprocessar números, lidando com strings vazias e valores numéricos
const preprocessNumber = (schema: z.ZodNumber) =>
  z.preprocess((val) => {
    if (val === "" || val === null) return null; // Trata string vazia ou null como null
    if (typeof val === "number") return val; // Se já é número, retorna o próprio número
    if (typeof val === "string") return parseFloat(val); // Se é string, tenta parsear
    return undefined; // Para outros tipos, retorna undefined para falha de validação
  }, z.union([schema, z.literal(null)])); // Aceita o schema numérico ou null

export const debtSchema = z
  .object({
    description: z.string().min(1, "A descrição é obrigatória."),
    originalAmount: preprocessNumber(
      z.number().positive("O valor original deve ser um número positivo.")
    ),
    isRecurring: z.boolean(),
    type: z.string().min(1, "O tipo de dívida é obrigatório."),

    totalInstallments: preprocessNumber(
      z
        .number()
        .int()
        .positive("O total de parcelas deve ser um número inteiro positivo.")
    )
      .optional()
      .nullable(),

    expectedInstallmentAmount: preprocessNumber(
      z.number().positive("O valor da parcela deve ser um número positivo.")
    )
      .optional()
      .nullable(),

    interestRate: preprocessNumber(
      z.number().nonnegative("A taxa de juros não pode ser negativa.")
    )
      .optional()
      .nullable(),

    fineRate: preprocessNumber(
      z.number().nonnegative("A taxa de multa não pode ser negativa.")
    )
      .optional()
      .nullable(),

    startDate: z.string().min(1, "A data de início é obrigatória."),
    endDate: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    // Validação condicional: se não for recorrente E tiver totalInstallments,
    // expectedInstallmentAmount é obrigatório e positivo
    if (
      !data.isRecurring &&
      data.totalInstallments &&
      data.totalInstallments > 0
    ) {
      if (
        data.expectedInstallmentAmount === null ||
        data.expectedInstallmentAmount === undefined
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "O valor da parcela é obrigatório para dívidas parceladas.",
          path: ["expectedInstallmentAmount"],
        });
      } else if (
        data.expectedInstallmentAmount !== null &&
        data.expectedInstallmentAmount <= 0
      ) {
        // Adicionado !== null
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "O valor da parcela deve ser um número positivo.",
          path: ["expectedInstallmentAmount"],
        });
      }
    }
  });

export type DebtFormData = z.infer<typeof debtSchema>;

export type DebtFormSubmitData = Omit<DebtFormData, "type"> & {
  type: Debt["type"];
};
