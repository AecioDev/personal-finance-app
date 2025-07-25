import { z } from "zod";

const preprocessNumber = (schema: z.ZodNumber) =>
  z.preprocess((val) => {
    if (val === "" || val === null) return null;
    if (typeof val === "number") {
      return isNaN(val) ? null : val; // Trata NaN de valueAsNumber:true
    }
    if (typeof val === "string") {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? null : parsed;
    }
    return undefined;
  }, z.union([schema, z.literal(null)]));

export const debtInstallmentSchema = z
  .object({
    installmentNumber: preprocessNumber(
      z
        .number()
        .int()
        .positive("O número da parcela deve ser um número inteiro positivo.")
    )
      .optional()
      .nullable(),
    expectedDueDate: z.string().min(1, "A data de vencimento é obrigatória."),
    expectedAmount: preprocessNumber(
      z.number().positive("O valor esperado deve ser um número positivo.")
    ),
    status: z.enum(["pending", "paid", "overdue"], {
      message: "O status é obrigatório.",
    }),

    // CORRIGIDO: Usa preprocessNumber diretamente, sem z.string().pipe()
    actualPaidAmount: preprocessNumber(
      z.number().nonnegative("O valor pago não pode ser negativo.")
    )
      .optional()
      .nullable(),

    interestPaidOnInstallment: preprocessNumber(
      z.number().nonnegative("Juros pagos não podem ser negativos.")
    )
      .optional()
      .nullable(),
    finePaidOnInstallment: preprocessNumber(
      z.number().nonnegative("Multa paga não pode ser negativa.")
    )
      .optional()
      .nullable(),
    paymentDate: z.string().optional().nullable(),
    transactionId: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.status === "paid") {
      if (
        data.actualPaidAmount === null ||
        data.actualPaidAmount === undefined
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "O valor pago é obrigatório para parcelas pagas.",
          path: ["actualPaidAmount"],
        });
      }
      if (
        data.paymentDate === null ||
        data.paymentDate === undefined ||
        data.paymentDate.trim() === ""
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "A data do pagamento é obrigatória para parcelas pagas.",
          path: ["paymentDate"],
        });
      }
    }
  });

export type DebtInstallmentFormData = z.infer<typeof debtInstallmentSchema>;
