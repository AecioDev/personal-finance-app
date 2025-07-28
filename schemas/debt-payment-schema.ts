import { z } from "zod";

// GÊ: Este schema agora está mais simples e robusto.
export const debtPaymentSchema = z.object({
  // GÊ: Alterado de z.string() para z.number().
  // O react-hook-form com { valueAsNumber: true } no register() cuida da conversão.
  actualPaidAmount: z
    .number({
      required_error: "O valor pago é obrigatório.",
      invalid_type_error: "O valor pago deve ser um número.",
    })
    .positive("O valor pago deve ser maior que zero."),

  paymentDate: z.string().min(1, "A data do pagamento é obrigatória."),

  paymentMethodId: z.string().min(1, "A forma de pagamento é obrigatória."),
});

export type DebtPaymentFormData = z.infer<typeof debtPaymentSchema>;
