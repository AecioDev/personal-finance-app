"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Icon } from "@iconify/react"

interface Transaction {
  id: string
  descricao: string
  valor: number
  tipo: "receita" | "despesa"
  data: string
  contaId: string
  userId: string
}

const aiTips = [
  {
    icon: "mdi:lightbulb",
    title: "Dica de Economia",
    content: "Você gastou 30% a mais em transportes este mês. Considere usar transporte público ou caronas.",
  },
  {
    icon: "mdi:piggy-bank",
    title: "Meta de Poupança",
    content: "Considere guardar 10% da sua receita mensal. Isso representa aproximadamente R$ 300,00.",
  },
  {
    icon: "mdi:trending-up",
    title: "Oportunidade de Renda",
    content: "Suas receitas estão estáveis. Que tal explorar uma renda extra ou investimentos?",
  },
  {
    icon: "mdi:alert-circle",
    title: "Alerta de Gastos",
    content: "Seus gastos com alimentação aumentaram 15% comparado ao mês passado.",
  },
]

export function ReportsView() {
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    const savedTransactions = localStorage.getItem("transactions")
    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions))
    }
  }, [])

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const monthlyTransactions = transactions.filter((t) => {
    const transactionDate = new Date(t.data)
    return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear
  })

  const totalReceitas = monthlyTransactions.filter((t) => t.tipo === "receita").reduce((sum, t) => sum + t.valor, 0)

  const totalDespesas = monthlyTransactions.filter((t) => t.tipo === "despesa").reduce((sum, t) => sum + t.valor, 0)

  const saldoMensal = totalReceitas - totalDespesas

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Relatórios e Insights</h1>

      {/* Resumo Mensal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receitas do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              +R$ {totalReceitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Despesas do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              -R$ {totalDespesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${saldoMensal >= 0 ? "text-green-600" : "text-red-600"}`}>
              {saldoMensal >= 0 ? "+" : ""}R$ {saldoMensal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Simples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon icon="mdi:chart-bar" className="w-5 h-5" />
            Visão Geral do Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Receitas</span>
                <span className="text-sm text-green-600">
                  R$ {totalReceitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all duration-500"
                  style={{
                    width: totalReceitas > 0 ? `${(totalReceitas / (totalReceitas + totalDespesas)) * 100}%` : "0%",
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Despesas</span>
                <span className="text-sm text-red-600">
                  R$ {totalDespesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-red-500 h-3 rounded-full transition-all duration-500"
                  style={{
                    width: totalDespesas > 0 ? `${(totalDespesas / (totalReceitas + totalDespesas)) * 100}%` : "0%",
                  }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dicas de IA */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Icon icon="mdi:robot" className="w-6 h-6 text-primary" />
          Insights Inteligentes
        </h2>
        <div className="grid gap-4">
          {aiTips.map((tip, index) => (
            <Card key={index} className="border-l-4 border-l-primary">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon icon={tip.icon} className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{tip.title}</h3>
                    <p className="text-sm text-muted-foreground">{tip.content}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
