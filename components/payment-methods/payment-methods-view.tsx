"use client";

import React, { useState } from "react";
import { useFinance } from "@/components/providers/finance-provider";
import { PaymentMethod } from "@/interfaces/finance";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { useToast } from "@/components/ui/use-toast";
import { PageViewLayout } from "../layout/page-view-layout";
import { ConfirmationDialog } from "../common/confirmation-dialog";
// Importando nosso novo modal
import { PaymentMethodManagerDialog } from "./payment-methods-manager-dialog";

export function PaymentMethodsView() {
  const { toast } = useToast();
  const { paymentMethods, deletePaymentMethod } = useFinance();

  const [methodSelected, setMethodSelected] = useState<PaymentMethod | null>(
    null
  );
  // Unificamos o estado de abertura do modal
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Função para abrir o modal em modo de EDIÇÃO
  const handleEditClick = (method: PaymentMethod) => {
    setMethodSelected(method);
    setIsManagerOpen(true);
  };

  // Função para abrir o modal em modo de CRIAÇÃO
  const handleAddClick = () => {
    setMethodSelected(null); // Garante que não há dados de edição
    setIsManagerOpen(true);
  };

  const handleDeleteClick = (method: PaymentMethod) => {
    setMethodSelected(method);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!methodSelected) return;
    try {
      await deletePaymentMethod(methodSelected.id);
      toast({ title: "Sucesso!", description: "Forma de pagamento excluída." });
    } catch (error) {
      toast({
        title: "Erro!",
        description: `Não foi possível excluir a forma de pagamento: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsDeleteConfirmOpen(false);
      setMethodSelected(null);
    }
  };

  return (
    <PageViewLayout title="Formas de Pagamento">
      <div>
        <Button
          className="w-full my-2 text-base font-semibold bg-status-complete text-status-complete-foreground"
          size="sm"
          onClick={handleAddClick}
        >
          <Icon icon="mdi:plus" className="h-6 w-6" />
          Nova Forma de Pagamento
        </Button>
      </div>

      <div className="space-y-4">
        {paymentMethods.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 rounded-xl bg-background hover:bg-muted/50 transition-colors border-l-4 border-b-2 border-status-complete "
          >
            <div>
              <h3 className="text-lg font-semibold">{item.name}</h3>
              {item.description && (
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() => handleEditClick(item)}
              >
                <Icon icon="fa6-solid:pencil" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => handleDeleteClick(item)}
              >
                <Icon icon="fa6-solid:trash-can" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Renderizando nosso modal único para criar e editar */}
      <PaymentMethodManagerDialog
        isOpen={isManagerOpen}
        onOpenChange={setIsManagerOpen}
        methodToEdit={methodSelected}
      />

      <ConfirmationDialog
        isOpen={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title={`Excluir "${methodSelected?.name}"?`}
        description="Esta ação não pode ser desfeita e removerá permanentemente a forma de pagamento."
        onConfirm={handleConfirmDelete}
        variant="destructive"
      />
    </PageViewLayout>
  );
}
