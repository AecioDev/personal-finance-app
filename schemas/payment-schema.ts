// src/schemas/payment-schema.ts
import { z } from "zod";

export const paymentSchema = z.object({
  amount: z
    .number({ required_error: "O valor pago é obrigatório." })
    .positive("O valor pago deve ser maior que zero."),
  paymentDate: z.date({ required_error: "A data do pagamento é obrigatória." }),
  paymentMethodId: z.string().min(1, "A forma de pagamento é obrigatória."),
  accountId: z.string().min(1, "A conta de origem é obrigatória."),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;
