import { z } from "zod";

// Schema de validação para o formulário
export const PaymentMethodSchema = z.object({
  name: z.string().min(3, "A descrição é obrigatória."),
  description: z.string().optional(),
  isActive: z.boolean(),
});

export type PaymentMethodFormData = z.infer<typeof PaymentMethodSchema>;
