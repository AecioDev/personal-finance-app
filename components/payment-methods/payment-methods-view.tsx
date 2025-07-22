"use client";

import React, { useState } from "react";
import { useFinance } from "@/components/providers/finance-provider";
import { PaymentMethod } from "@/interfaces/finance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon } from "@iconify/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { ButtonNew } from "@/components/ui/button-new";
import { ButtonBack } from "@/components/ui/button-back";
import { useRouter } from "next/navigation";
import { PaymentMethodsForm } from "./payment-methods-form"; // Mantém a importação do formulário separado
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Importar Select

export function PaymentMethodsView() {
  const {
    accounts,
    paymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    loadingFinanceData,
    errorFinanceData,
  } = useFinance();
  const { toast } = useToast();
  const router = useRouter();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(
    null
  );
  const [methodName, setMethodName] = useState("");
  const [methodDescription, setMethodDescription] = useState("");
  const [defaultAccountId, setDefaultAccountId] = useState<string | null>(null);

  const handleOpenForm = (method?: PaymentMethod) => {
    if (method) {
      setEditingMethod(method);
      setMethodName(method.name);
      setMethodDescription(method.description || "");
      setDefaultAccountId(method.defaultAccountId || null);
    } else {
      setEditingMethod(null);
      setMethodName("");
      setMethodDescription("");
      setDefaultAccountId(null);
    }
    setIsFormOpen(true);
  };

  const handleSaveMethod = async () => {
    if (!methodName.trim()) {
      toast({
        title: "Erro",
        description: "O nome da forma de pagamento é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (loadingFinanceData) {
      toast({
        title: "Aguarde",
        description:
          "Os dados financeiros ainda estão sendo carregados. Tente novamente em alguns instantes.",
        variant: "default",
      });
      return;
    }

    try {
      if (editingMethod) {
        await updatePaymentMethod(editingMethod.id, {
          name: methodName,
          description: methodDescription,
          defaultAccountId: defaultAccountId, // Salva a conta padrão
        });
        toast({
          title: "Sucesso",
          description: "Forma de pagamento atualizada.",
        });
      } else {
        await addPaymentMethod({
          name: methodName,
          description: methodDescription,
          defaultAccountId: defaultAccountId, // Salva a conta padrão
        });
        toast({
          title: "Sucesso",
          description: "Forma de pagamento adicionada.",
        });
      }
      setIsFormOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a forma de pagamento.",
        variant: "destructive",
      });
      console.error("Erro ao salvar forma de pagamento:", error);
    }
  };

  const handleDeleteMethod = async (methodId: string) => {
    if (
      window.confirm("Tem certeza que deseja excluir esta forma de pagamento?")
    ) {
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
        await deletePaymentMethod(methodId);
        toast({
          title: "Sucesso",
          description: "Forma de pagamento excluída.",
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível excluir a forma de pagamento.",
          variant: "destructive",
        });
        console.error("Erro ao excluir forma de pagamento:", error);
      }
    }
  };

  if (loadingFinanceData) {
    return (
      <div className="flex justify-center items-center h-48">
        <p className="text-gray-500 dark:text-gray-400">
          Carregando formas de pagamento...
        </p>
      </div>
    );
  }

  if (errorFinanceData) {
    return (
      <div className="text-center text-red-500 p-4">
        <p>Erro ao carregar dados: {errorFinanceData}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Formas de Pagamento</h1>

        <div className="flex gap-2">
          <ButtonBack onClick={() => router.back()} />
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <ButtonNew
                onClick={() => handleOpenForm()}
                disabled={loadingFinanceData}
              >
                Adicionar
              </ButtonNew>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingMethod
                    ? "Editar Forma de Pagamento"
                    : "Nova Forma de Pagamento"}
                </DialogTitle>
                <DialogDescription>
                  {editingMethod
                    ? "Altere os detalhes da sua forma de pagamento."
                    : "Adicione uma nova forma de pagamento para suas transações."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nome
                  </Label>
                  <Input
                    id="name"
                    value={methodName}
                    onChange={(e) => setMethodName(e.target.value)}
                    className="col-span-3"
                    placeholder="Ex: PIX, Cartão Nubank"
                    disabled={loadingFinanceData}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Descrição
                  </Label>
                  <Input
                    id="description"
                    value={methodDescription}
                    onChange={(e) => setMethodDescription(e.target.value)}
                    className="col-span-3"
                    placeholder="Ex: Chave pessoal, Final 1234"
                    disabled={loadingFinanceData}
                  />
                </div>
                {/* Campo para Conta Padrão */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="defaultAccountId" className="text-right">
                    Conta Padrão
                  </Label>
                  <Select
                    value={defaultAccountId || ""}
                    onValueChange={(value: string) =>
                      setDefaultAccountId(value || null)
                    }
                    disabled={loadingFinanceData || accounts.length === 0}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione uma conta (Opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhuma</SelectItem>
                      {accounts.length === 0 ? (
                        <p className="p-2 text-sm text-muted-foreground">
                          Nenhuma conta cadastrada.
                        </p>
                      ) : (
                        accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleSaveMethod}
                  disabled={loadingFinanceData}
                >
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {paymentMethods.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">
          Nenhuma forma de pagamento cadastrada. Adicione uma!
        </p>
      ) : (
        <div className="grid gap-4">
          {paymentMethods.map((method) => (
            <Card key={method.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <h3 className="text-lg font-semibold">{method.name}</h3>
                  {method.description && (
                    <p className="text-sm text-muted-foreground">
                      {method.description}
                    </p>
                  )}
                  {method.defaultAccountId &&
                    accounts.find(
                      (acc) => acc.id === method.defaultAccountId
                    ) && (
                      <p className="text-xs text-muted-foreground">
                        Conta:{" "}
                        {
                          accounts.find(
                            (acc) => acc.id === method.defaultAccountId
                          )?.name
                        }
                      </p>
                    )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleOpenForm(method)}
                    disabled={loadingFinanceData}
                  >
                    <Icon icon="mdi:pencil" className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteMethod(method.id)}
                    disabled={loadingFinanceData}
                  >
                    <Icon icon="mdi:delete" className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
