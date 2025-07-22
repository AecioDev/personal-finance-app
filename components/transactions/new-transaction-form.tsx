"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Icon } from "@iconify/react";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "../ui/use-toast";

interface Account {
  id: string;
  nome: string;
  saldo: number;
}

export function NewTransactionForm() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [formData, setFormData] = useState({
    descricao: "",
    valor: "",
    data: new Date().toISOString().split("T")[0],
    tipo: "despesa" as "receita" | "despesa",
    contaId: "",
  });

  useEffect(() => {
    const savedAccounts = localStorage.getItem("accounts");
    if (savedAccounts) {
      setAccounts(JSON.parse(savedAccounts));
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.descricao || !formData.valor || !formData.contaId) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const newTransaction = {
      id: Date.now().toString(),
      descricao: formData.descricao,
      valor: Number.parseFloat(formData.valor),
      tipo: formData.tipo,
      data: formData.data,
      contaId: formData.contaId,
      userId: user?.uid || "1",
    };

    // Salvar transação
    const savedTransactions = localStorage.getItem("transactions");
    const transactions = savedTransactions ? JSON.parse(savedTransactions) : [];
    transactions.push(newTransaction);
    localStorage.setItem("transactions", JSON.stringify(transactions));

    // Atualizar saldo da conta
    const updatedAccounts = accounts.map((account) => {
      if (account.id === formData.contaId) {
        const valorAjustado =
          formData.tipo === "receita"
            ? account.saldo + newTransaction.valor
            : account.saldo - newTransaction.valor;
        return { ...account, saldo: valorAjustado };
      }
      return account;
    });

    setAccounts(updatedAccounts);
    localStorage.setItem("accounts", JSON.stringify(updatedAccounts));

    toast({
      title: "Sucesso!",
      description: "Lançamento adicionado com sucesso",
    });

    router.push("/");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <Icon icon="mdi:arrow-left" className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">Novo Lançamento</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Adicionar Transação</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="tipo">Tipo *</Label>
              <RadioGroup
                value={formData.tipo}
                onValueChange={(value: "receita" | "despesa") =>
                  setFormData((prev) => ({ ...prev, tipo: value }))
                }
                className="flex gap-6 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="receita" id="receita" />
                  <Label
                    htmlFor="receita"
                    className="text-green-600 font-medium"
                  >
                    <Icon icon="mdi:arrow-up" className="w-4 h-4 inline mr-1" />
                    Receita
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="despesa" id="despesa" />
                  <Label htmlFor="despesa" className="text-red-600 font-medium">
                    <Icon
                      icon="mdi:arrow-down"
                      className="w-4 h-4 inline mr-1"
                    />
                    Despesa
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    descricao: e.target.value,
                  }))
                }
                placeholder="Ex: Salário, Supermercado, etc."
                required
              />
            </div>

            <div>
              <Label htmlFor="valor">Valor *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, valor: e.target.value }))
                }
                placeholder="0,00"
                required
              />
            </div>

            <div>
              <Label htmlFor="data">Data *</Label>
              <Input
                id="data"
                type="date"
                value={formData.data}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, data: e.target.value }))
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="conta">Conta *</Label>
              <Select
                value={formData.contaId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, contaId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.nome} - R${" "}
                      {account.saldo.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" size="lg">
              <Icon icon="mdi:check" className="w-5 h-5 mr-2" />
              Salvar Lançamento
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
