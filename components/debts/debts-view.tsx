"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFinance } from "@/components/providers/finance-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@iconify/react";
import { ButtonNew } from "@/components/ui/button-new";
import { ButtonBack } from "@/components/ui/button-back";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { getDDMMYYYY } from "@/lib/dates";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { Debt } from "@/interfaces/finance";

export function DebtsView() {
  const router = useRouter();
  const { debts, deleteDebt, loadingFinanceData, errorFinanceData } =
    useFinance();
  const { toast } = useToast();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [debtToDelete, setDebtToDelete] = useState<Debt | null>(null);

  useEffect(() => {
    if (errorFinanceData) {
      toast({
        title: "Erro ao carregar dados",
        description: errorFinanceData,
        variant: "destructive",
      });
    }
  }, [errorFinanceData, toast]);

  const handleEditDebt = (debtId: string) => {
    router.push(`/debts/${debtId}/edit`);
  };

  const openDeleteDialog = (debt: Debt) => {
    setDebtToDelete(debt);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!debtToDelete) return;

    const success = await deleteDebt(debtToDelete.id);
    if (success) {
      toast({
        title: "Sucesso",
        description: "Dívida e suas parcelas foram excluídas.",
        variant: "success",
      });
    }
    setIsDeleteDialogOpen(false);
    setDebtToDelete(null);
  };

  const getDebtIcon = (type: string) => {
    switch (type) {
      case "credit_card_bill":
        return "mdi:credit-card";
      case "loan":
        return "mdi:cash-multiple";
      default:
        return "mdi:tag-outline";
    }
  };

  if (loadingFinanceData) {
    return <div className="p-4 text-center">Carregando dívidas...</div>;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <ButtonBack onClick={() => router.back()} />
          <h1 className="text-2xl font-bold">Minhas Dívidas</h1>
          <ButtonNew onClick={() => router.push("/new-debt")}>
            Nova Dívida
          </ButtonNew>
        </div>

        {debts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Icon
                icon="mdi:credit-card-off-outline"
                className="w-16 h-16 mx-auto mb-4 text-muted-foreground"
              />
              <h3 className="text-lg font-semibold mb-2">
                Nenhuma dívida cadastrada
              </h3>
              <p className="text-muted-foreground mb-4">
                Adicione suas dívidas para ter controle total.
              </p>
              <ButtonNew onClick={() => router.push("/new-debt")}>
                Adicionar Primeira Dívida
              </ButtonNew>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {debts.map((debt) => (
              <Link key={debt.id} href={`/debts/${debt.id}`} className="block">
                <Card
                  className={
                    debt.isActive
                      ? "hover:bg-muted/50 transition-colors cursor-pointer"
                      : "opacity-70"
                  }
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Icon
                          icon={getDebtIcon(debt.type)}
                          className="w-5 h-5 text-primary"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">
                          {debt.description}
                        </h3>
                        {debt.isRecurring ? (
                          <p className="text-sm text-muted-foreground">
                            Recorrente: R${" "}
                            {debt.originalAmount?.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                            /mês
                          </p>
                        ) : (
                          <>
                            <p className="text-sm text-muted-foreground">
                              Saldo: R${" "}
                              {debt.currentOutstandingBalance?.toLocaleString(
                                "pt-BR",
                                { minimumFractionDigits: 2 }
                              )}
                            </p>
                            {debt.totalInstallments && (
                              <p className="text-sm text-muted-foreground">
                                Parcelas: {debt.paidInstallments ?? 0}/
                                {debt.totalInstallments}
                              </p>
                            )}
                            {debt.expectedInstallmentAmount && (
                              <p className="text-sm text-muted-foreground">
                                Valor Parcela: R${" "}
                                {debt.expectedInstallmentAmount.toLocaleString(
                                  "pt-BR",
                                  { minimumFractionDigits: 2 }
                                )}
                              </p>
                            )}
                          </>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Início: {getDDMMYYYY(debt.startDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          handleEditDebt(debt.id);
                        }}
                      >
                        <Icon icon="mdi:pencil" className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          openDeleteDialog(debt);
                        }}
                      >
                        <Icon icon="mdi:delete" className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={`Excluir Dívida: ${debtToDelete?.description}?`}
        description="Esta ação é permanente e excluirá todas as parcelas associadas. Deseja continuar?"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </>
  );
}
