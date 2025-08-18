"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFinance } from "@/components/providers/finance-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@iconify/react";
import { ButtonNew } from "@/components/ui/button-new";
import { ButtonBack } from "@/components/ui/button-back";
import { useToast } from "@/components/ui/use-toast";
import { getDDMMYYYY } from "@/lib/dates";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { Debt, Category } from "@/interfaces/finance";
import { Badge } from "@/components/ui/badge";

export function DebtsView() {
  const router = useRouter();
  const {
    debts,
    categories,
    deleteDebt,
    loadingFinanceData,
    errorFinanceData,
  } = useFinance();
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
      });
    }
    setIsDeleteDialogOpen(false);
    setDebtToDelete(null);
  };

  const getCategoryIcon = (categoryId?: string) => {
    if (!categoryId) return "mdi:tag-outline";
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.icon || "mdi:help-circle-outline";
  };

  const getDebtStatus = (
    debt: Debt
  ): {
    text: string;
    variant: "default" | "secondary" | "destructive" | "warning";
  } => {
    if (!debt.isActive) {
      return { text: "Finalizada", variant: "secondary" };
    }
    if ((debt.totalPaidOnThisDebt || 0) > 0) {
      return { text: "Em Andamento", variant: "default" };
    }
    return { text: "Em Aberto", variant: "warning" };
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
              <Button
                variant="default"
                size="sm"
                onClick={() => router.push("/new-debt")}
              >
                <Icon icon="mdi:plus" className="w-4 h-4 mr-2" />
                Adicionar Primeira Dívida
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {debts.map((debt) => {
              const isSimpleOrRecurring =
                debt.type === "simple" || debt.isRecurring;
              const canEditOrDelete = (debt.totalPaidOnThisDebt || 0) === 0;
              const status = getDebtStatus(debt);

              return (
                <Link
                  key={debt.id}
                  href={`/debts/${debt.id}`}
                  className="block"
                >
                  <Card
                    className={
                      debt.isActive
                        ? "hover:bg-muted/50 transition-colors cursor-pointer"
                        : "opacity-70"
                    }
                  >
                    {/* AJUSTE: Layout de 3 colunas com Flexbox */}
                    <CardContent className="flex items-center gap-3 p-4">
                      {/* Coluna 1: Ícone (largura fixa) */}
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Icon
                          icon={getCategoryIcon(debt.categoryId)}
                          className="w-5 h-5 text-primary"
                        />
                      </div>

                      {/* Coluna 2: Informações (flexível) */}
                      <div className="min-w-0 flex-grow">
                        <h3 className="text-lg font-semibold truncate">
                          {debt.description}
                        </h3>

                        {isSimpleOrRecurring ? (
                          <div className="text-sm text-muted-foreground leading-tight">
                            <p>
                              {(
                                debt.expectedInstallmentAmount ||
                                debt.originalAmount
                              )?.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </p>
                            <p>Vencimento: {getDDMMYYYY(debt.startDate)}</p>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-muted-foreground">
                              Saldo:{" "}
                              {debt.currentOutstandingBalance?.toLocaleString(
                                "pt-BR",
                                { style: "currency", currency: "BRL" }
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Parcelas: {debt.paidInstallments ?? 0}/
                              {debt.totalInstallments}
                            </p>
                          </>
                        )}

                        <div className="mt-2">
                          <Badge variant={status.variant}>{status.text}</Badge>
                        </div>
                      </div>

                      {/* Coluna 3: Botões (largura fixa para alinhamento) */}
                      <div className="flex flex-shrink-0 gap-2 w-[88px] justify-end">
                        {canEditOrDelete && (
                          <>
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
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
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
