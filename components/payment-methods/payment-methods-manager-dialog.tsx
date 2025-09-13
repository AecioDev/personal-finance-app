"use client";

import { useEffect } from "react";
import { useFinance } from "@/components/providers/finance-provider";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  PaymentMethodFormData,
  PaymentMethodSchema,
} from "@/schemas/payment-method-schema";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { PaymentMethod } from "@/interfaces/finance";
import { Icon } from "@iconify/react";
import { Switch } from "../ui/switch";
import { cn } from "@/lib/utils";

interface PaymentMethodManagerDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  methodToEdit?: PaymentMethod | null;
}

const defaultFormValues: PaymentMethodFormData = {
  name: "",
  description: "",
  isActive: true,
};

export function PaymentMethodManagerDialog({
  isOpen,
  onOpenChange,
  methodToEdit,
}: PaymentMethodManagerDialogProps) {
  const { toast } = useToast();
  const { addPaymentMethod, updatePaymentMethod } = useFinance();

  const form = useForm<PaymentMethodFormData>({
    resolver: zodResolver(PaymentMethodSchema),
    defaultValues: defaultFormValues,
  });

  const isActiveValue = form.watch("isActive");

  // Efeito para popular o formulário quando estiver editando
  useEffect(() => {
    if (methodToEdit) {
      const formValues = {
        ...methodToEdit,
        description: methodToEdit.description || "",
      };
      form.reset(formValues);
    } else {
      form.reset(defaultFormValues);
    }
  }, [methodToEdit, isOpen, form]);

  const onSubmit = async (data: PaymentMethodFormData) => {
    try {
      if (methodToEdit) {
        // LÓGICA DE ATUALIZAÇÃO
        await updatePaymentMethod(methodToEdit.id, data);
        toast({
          title: "Sucesso!",
          description: "Forma de pagamento atualizada.",
        });
      } else {
        // LÓGICA DE CRIAÇÃO
        await addPaymentMethod(data);
        toast({
          title: "Sucesso!",
          description: "Nova forma de pagamento criada.",
        });
      }
      onOpenChange(false); // Fecha o modal após o sucesso
    } catch (error) {
      toast({
        title: "Erro!",
        description: `Não foi possível salvar a forma de pagamento: ${error}`,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {methodToEdit
              ? "Editar Forma de Pagamento"
              : "Nova Forma de Pagamento"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para salvar a forma de pagamento.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Cartão de Crédito Nubank"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Vencimento todo dia 10"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {methodToEdit && (
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Status</FormLabel>
                      <FormDescription>
                        A forma de pagamento está{" "}
                        <span
                          className={cn(
                            "font-bold",
                            isActiveValue
                              ? "text-status-complete"
                              : "text-surface-foreground"
                          )}
                        >
                          {isActiveValue ? "ATIVA" : "INATIVA"}
                        </span>
                        .
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            <Button
              type="submit"
              className="w-full bg-status-complete text-status-complete-foreground"
              disabled={form.formState.isSubmitting}
            >
              <Icon icon="fa6-solid:floppy-disk" className="mr-2 h-4 w-4" />
              {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
