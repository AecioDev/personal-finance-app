// in: schemas/transfer-schema.ts

import { z } from "zod";

export const TransferSchema = z
  .object({
    description: z
      .string()
      .min(3, "A descrição deve ter pelo menos 3 caracteres."),
    amount: z
      .number({ invalid_type_error: "O valor é obrigatório." })
      .positive("O valor deve ser maior que zero."),
    date: z.date({ required_error: "A data da transferência é obrigatória." }),
    sourceAccountId: z.string().min(1, "A conta de origem é obrigatória."),
    destinationAccountId: z
      .string()
      .min(1, "A conta de destino é obrigatória."),
    notes: z.string().optional(),
  })
  .refine((data) => data.sourceAccountId !== data.destinationAccountId, {
    message: "A conta de origem e destino não podem ser a mesma.",
    path: ["destinationAccountId"],
  });

export type TransferFormData = z.infer<typeof TransferSchema>;
