// Em src/schemas/partial-payment-schema.ts
import { z } from "zod";

export const partialPaymentSchema = z.object({
  amount: z
    .number({ required_error: "O valor pago é obrigatório." })
    .positive("O valor pago deve ser maior que zero."),

  paymentDate: z.string().min(1, "A data do pagamento é obrigatória."),
  paymentMethodId: z.string().min(1, "A forma de pagamento é obrigatória."),
  accountId: z.string().min(1, "A conta de origem é obrigatória."),
  interestPaid: z
    .number()
    .nonnegative("Juros não pode ser negativo.")
    .nullable()
    .optional(),
  discountReceived: z
    .number()
    .nonnegative("Desconto não pode ser negativo.")
    .nullable()
    .optional(),
});

export type PartialPaymentFormData = z.infer<typeof partialPaymentSchema>;
