// components/reports/category-pie-chart.tsx
"use client";

import React, { useMemo } from "react";
import {
  Pie,
  PieChart,
  ResponsiveContainer,
  Cell,
  Tooltip,
  Legend,
  Label,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategorySummary } from "./category-summary-list";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#A569BD",
  "#EC7063",
  "#5DADE2",
  "#48C9B0",
  "#F4D03F",
];

const OTHERS_COLOR = "#B0B0B0"; // Cor para a fatia "Outros"

interface CategoryPieChartProps {
  data: CategorySummary[];
  title: string;
}

export function CategoryPieChart({ data, title }: CategoryPieChartProps) {
  const totalValue = useMemo(
    () => data.reduce((sum, item) => sum + item.total, 0),
    [data]
  );

  const processedData = useMemo(() => {
    const threshold = 4; // Agrupa categorias com menos de 4%
    let mainData: CategorySummary[] = [];
    let otherData: CategorySummary[] = [];

    data.forEach((item) => {
      const percentage = (item.total / totalValue) * 100;
      if (percentage < threshold) {
        otherData.push(item);
      } else {
        mainData.push(item);
      }
    });

    if (otherData.length > 1) {
      const otherTotal = otherData.reduce((sum, item) => sum + item.total, 0);
      mainData.push({
        categoryId: "others",
        name: "Outros",
        icon: "mdi:dots-horizontal",
        total: otherTotal,
        type: data[0]?.type || "expense",
      });
    } else {
      mainData = [...mainData, ...otherData];
    }

    return mainData.sort((a, b) => b.total - a.total);
  }, [data, totalValue]);

  if (processedData.length === 0) {
    return null;
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = totalValue > 0 ? (data.total / totalValue) * 100 : 0;
      return (
        <div className="p-2 bg-background/80 border rounded-lg shadow-sm backdrop-blur-sm">
          <p className="font-semibold">{`${
            data.name
          }: ${data.total.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}`}</p>
          <p className="text-sm text-muted-foreground">{`Representa ${percentage.toFixed(
            2
          )}% do total`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Aumentamos a altura aqui */}
        <div style={{ width: "100%", height: 350 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={processedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={110} // Raio maior
                innerRadius={70} // Raio interno para virar rosca
                fill="#8884d8"
                dataKey="total"
                nameKey="name"
                label={({ name, percent }) => {
                  if (percent < 0.05) return ""; // Não exibe label para fatias menores que 5%
                  return `${(percent * 100).toFixed(0)}%`;
                }}
              >
                {processedData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.name === "Outros"
                        ? OTHERS_COLOR
                        : COLORS[index % COLORS.length]
                    }
                  />
                ))}
                <Label
                  value={totalValue.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                  position="center"
                  dy={-5}
                  className="fill-foreground text-2xl font-bold"
                />
                <Label
                  value="Total"
                  position="center"
                  dy={20}
                  className="fill-muted-foreground text-sm"
                />
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                wrapperStyle={{ paddingTop: 20 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
