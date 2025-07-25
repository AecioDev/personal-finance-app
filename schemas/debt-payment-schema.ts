import { z } from "zod";

const preprocessNumber = (schema: z.ZodNumber) =>
  z.preprocess((val) => {
    if (val === "" || val === null) return null;
    if (typeof val === "number") return val;
    if (typeof val === "string") {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
  }, z.union([schema, z.literal(null)]));

export const debtPaymentSchema = z.object({
  actualPaidAmount: z
    .string()
    .min(1, "O valor pago é obrigatório.")
    .pipe(
      preprocessNumber(
        z.number().positive("O valor pago deve ser um número positivo.")
      )
    ),
  paymentDate: z.string().min(1, "A data do pagamento é obrigatória."),
  paymentMethodId: z.string().min(1, "A forma de pagamento é obrigatória."),
});

export type DebtPaymentFormData = z.infer<typeof debtPaymentSchema>;
