"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFinance } from "@/components/providers/finance-provider";
import { Debt, DebtInstallment } from "@/interfaces/finance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { ButtonBack } from "@/components/ui/button-back";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { DebtPaymentModal } from "./debt-payment-modal";
import { DebtInstallmentModal } from "./debt-installment-modal";

interface DebtDetailsViewProps {
  debtId: string;
}

export function DebtDetailsView({ debtId }: DebtDetailsViewProps) {
  const router = useRouter();
  const {
    debts,
    debtInstallments,
    deleteDebtInstallment,
    loadingFinanceData,
    errorFinanceData,
  } = useFinance();
  const { toast } = useToast();
  const [currentDebt, setCurrentDebt] = useState<Debt | undefined>(undefined);
  const [filteredInstallments, setFilteredInstallments] = useState<
    DebtInstallment[]
  >([]);
  const [hasProcessedInitialData, setHasProcessedInitialData] = useState(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<
    string | null
  >(null);

  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);
  const [editingInstallment, setEditingInstallment] =
    useState<DebtInstallment | null>(null);

  useEffect(() => {
    if (errorFinanceData) {
      toast({
        title: "Erro ao carregar dados",
        description: errorFinanceData,
        variant: "destructive",
      });
    }
  }, [errorFinanceData, toast]);

  useEffect(() => {
    if (!hasProcessedInitialData && !loadingFinanceData) {
      if (debts.length > 0) {
        const debt = debts.find((d) => d.id === debtId);
        if (debt) {
          setCurrentDebt(debt);
          const installments = debtInstallments.filter(
            (inst) => inst.debtId === debtId
          );
          setFilteredInstallments(installments);
          setHasProcessedInitialData(true);
        } else {
          toast({
            title: "Dívida não encontrada",
            description: "A dívida com o ID especificado não foi encontrada.",
            variant: "destructive",
          });
          router.back();
        }
      } else if (!errorFinanceData && debts.length === 0) {
        toast({
          title: "Dívida não encontrada",
          description: "A dívida com o ID especificado não foi encontrada.",
          variant: "destructive",
        });
        router.back();
      }
    }
  }, [
    debtId,
    debts,
    debtInstallments,
    loadingFinanceData,
    errorFinanceData,
    router,
    toast,
    hasProcessedInitialData,
  ]);

  const handleDeleteInstallment = async (installmentId: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta parcela?")) {
      try {
        if (loadingFinanceData) {
          toast({
            title: "Aguarde",
            description:
              "Os dados financeiros ainda estão sendo carregados. Tente novamente em alguns instantes.",
            variant: "default",
          });
          return;
        }
        const success = await deleteDebtInstallment(installmentId);
        if (success) {
          toast({
            title: "Sucesso",
            description: "Parcela excluída.",
            variant: "success",
          });
          setHasProcessedInitialData(false);
        } else {
          toast({
            title: "Erro ao excluir",
            description:
              "Não foi possível excluir a parcela. Verifique o console para mais detalhes.",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível excluir a parcela.",
          variant: "destructive",
        });
        console.error("Erro ao excluir parcela:", error);
      }
    }
  };

  const handleInformPayment = (installmentId: string) => {
    setSelectedInstallmentId(installmentId);
    setIsPaymentModalOpen(true);
  };

  const handleEditInstallment = (installment: DebtInstallment) => {
    setEditingInstallment(installment);
    setIsInstallmentModalOpen(true);
  };

  if (loadingFinanceData && !hasProcessedInitialData) {
    return (
      <div className="flex justify-center items-center h-48">
        <p className="text-gray-500 dark:text-gray-400">
          Carregando detalhes da dívida...
        </p>
      </div>
    );
  }

  if (!currentDebt && hasProcessedInitialData) {
    return (
      <div className="text-center p-4">
        <p className="text-lg text-red-500">
          Dívida não encontrada ou erro de carregamento.
        </p>
        <ButtonBack onClick={() => router.back()} className="mt-4">
          Voltar
        </ButtonBack>
      </div>
    );
  }

  if (!currentDebt) {
    return null;
  }

  const getInstallmentBadgeVariant = (
    status: DebtInstallment["status"]
  ):
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | null
    | undefined => {
    switch (status) {
      case "paid":
        return "success";
      case "overdue":
        return "destructive";
      case "pending":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <ButtonBack onClick={() => router.back()} />
        <h1 className="text-2xl font-bold">{currentDebt.description}</h1>
        <div className="w-10 h-10"></div>
      </div>

      <Card className="bg-background border border-border shadow-sm">
        <CardHeader>
          <CardTitle>Resumo da Dívida</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <Card className="bg-background border border-border shadow-sm p-4">
            <p>
              <strong>Tipo:</strong> {currentDebt.type}
            </p>
            {/* ALTERADO: Adicionado ?. para originalAmount */}
            <p>
              <strong>Valor Original:</strong> R${" "}
              {currentDebt.originalAmount?.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </p>
            {!currentDebt.isRecurring && (
              <>
                <p>
                  <strong>Saldo Atual:</strong> R${" "}
                  {currentDebt.currentOutstandingBalance?.toLocaleString(
                    "pt-BR",
                    { minimumFractionDigits: 2 }
                  )}
                </p>
                <p>
                  <strong>Juros Pagos (Total):</strong> R${" "}
                  {currentDebt.totalInterestPaidOnThisDebt?.toLocaleString(
                    "pt-BR",
                    { minimumFractionDigits: 2 }
                  )}
                </p>
                <p>
                  <strong>Multas Pagas (Total):</strong> R${" "}
                  {currentDebt.totalFinePaidOnThisDebt?.toLocaleString(
                    "pt-BR",
                    { minimumFractionDigits: 2 }
                  )}
                </p>
                {currentDebt.totalInstallments && (
                  <p>
                    <strong>Parcelas Pagas:</strong>{" "}
                    {currentDebt.paidInstallments}/
                    {currentDebt.totalInstallments}
                  </p>
                )}
                <p>
                  <strong>Taxa de Juros:</strong> {currentDebt.interestRate}%
                </p>
                <p>
                  <strong>Taxa de Multa:</strong> {currentDebt.fineRate}%
                </p>
                <p>
                  <strong>Valor da Parcela:</strong> R${" "}
                  {currentDebt.expectedInstallmentAmount?.toLocaleString(
                    "pt-BR",
                    { minimumFractionDigits: 2 }
                  )}
                </p>
                <p>
                  <strong>Data de Término:</strong>{" "}
                  {currentDebt.endDate
                    ? format(
                        parse(currentDebt.endDate, "yyyy-MM-dd", new Date()),
                        "dd/MM/yyyy",
                        { locale: ptBR }
                      )
                    : "N/A"}
                </p>
              </>
            )}
            <p>
              <strong>Data de Início:</strong>{" "}
              {format(
                parse(currentDebt.startDate, "yyyy-MM-dd", new Date()),
                "dd/MM/yyyy",
                { locale: ptBR }
              )}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              {currentDebt.isActive ? "Ativa" : "Quitada"}
            </p>
          </Card>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Parcelas</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInstallments.length === 0 ? (
            <p className="text-center text-muted-foreground">
              Nenhuma parcela encontrada para esta dívida.
            </p>
          ) : (
            <div className="grid gap-4">
              {filteredInstallments.map((installment) => (
                <Card
                  key={installment.id}
                  className="bg-background border border-border shadow-sm"
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-semibold">
                        {installment.installmentNumber
                          ? `Parcela ${installment.installmentNumber}`
                          : `Ocorrência`}
                      </p>
                      <Badge
                        variant={getInstallmentBadgeVariant(installment.status)}
                      >
                        {installment.status === "paid"
                          ? "Paga"
                          : installment.status === "overdue"
                          ? "Atrasada"
                          : "Pendente"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Vencimento:{" "}
                      {format(
                        parse(
                          installment.expectedDueDate,
                          "yyyy-MM-dd",
                          new Date()
                        ),
                        "dd/MM/yyyy",
                        { locale: ptBR }
                      )}
                    </p>
                    {/* ALTERADO: Adicionado ?. para expectedAmount */}
                    <p className="text-sm">
                      Valor Esperado: R${" "}
                      {installment.expectedAmount?.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                    {installment.actualPaidAmount !== null && (
                      <p className="text-sm">
                        Valor Pago: R${" "}
                        {installment.actualPaidAmount.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    )}
                    {installment.interestPaidOnInstallment !== null &&
                      installment.interestPaidOnInstallment > 0 && (
                        <p className="text-sm text-red-400">
                          Juros Pagos: R${" "}
                          {installment.interestPaidOnInstallment.toLocaleString(
                            "pt-BR",
                            { minimumFractionDigits: 2 }
                          )}
                        </p>
                      )}
                    {installment.finePaidOnInstallment !== null &&
                      installment.finePaidOnInstallment > 0 && (
                        <p className="text-sm text-red-400">
                          Multa Paga: R${" "}
                          {installment.finePaidOnInstallment.toLocaleString(
                            "pt-BR",
                            { minimumFractionDigits: 2 }
                          )}
                        </p>
                      )}
                    {installment.paymentDate && (
                      <p className="text-xs text-muted-foreground">
                        Data Pagamento:{" "}
                        {format(
                          parse(
                            installment.paymentDate,
                            "yyyy-MM-dd",
                            new Date()
                          ),
                          "dd/MM/yyyy",
                          { locale: ptBR }
                        )}
                      </p>
                    )}

                    <div className="flex justify-end gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditInstallment(installment)}
                        disabled={loadingFinanceData}
                      >
                        <Icon icon="mdi:pencil" className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteInstallment(installment.id)}
                        disabled={loadingFinanceData}
                      >
                        <Icon icon="mdi:delete" className="w-4 h-4" />
                      </Button>
                      {installment.status !== "paid" && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleInformPayment(installment.id)}
                          disabled={loadingFinanceData}
                        >
                          <Icon icon="mdi:cash-check" className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DebtPaymentModal
        isOpen={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        installmentToPayId={selectedInstallmentId}
      />

      <DebtInstallmentModal
        isOpen={isInstallmentModalOpen}
        onOpenChange={setIsInstallmentModalOpen}
        editingInstallment={editingInstallment}
      />
    </div>
  );
}
