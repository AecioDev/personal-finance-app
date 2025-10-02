// components/reports/category-bar-chart.tsx
"use client";

import React from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LabelList,
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

interface CategoryBarChartProps {
  data: CategorySummary[];
  title: string;
  total: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-2 bg-background/80 border rounded-lg shadow-sm backdrop-blur-sm">
        <p className="font-semibold">{`${
          data.name
        }: ${data.total.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}`}</p>
      </div>
    );
  }
  return null;
};

const CustomizedYAxisTick = (props: any) => {
  const { x, y, payload } = props;
  //const maxChars = 12;
  const name = payload.value;

  const formattedName = name;
  //name.length > maxChars ? `${name.substring(0, maxChars)}...` : name;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={0}
        textAnchor="end"
        fill="#666"
        fontSize={12}
        dominantBaseline="middle"
      >
        <title>{name}</title>
        {formattedName}
      </text>
    </g>
  );
};

export function CategoryBarChart({
  data,
  title,
  total,
}: CategoryBarChartProps) {
  if (data.length === 0) {
    return null;
  }

  const chartHeight = data.length > 10 ? 600 : 400;
  const barThickness =
    data.length > 0 && data.length <= 6
      ? 60
      : data.length > 6 && data.length <= 10
      ? 50
      : 40;

  const renderCustomizedLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    const percentage = total > 0 ? (value / total) * 100 : 0;
    const labelText = `${value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })} (${percentage.toFixed(0)}%)`;

    const textWidth = labelText.length * 6.5;
    const isLabelInside = width > textWidth + 10;

    return (
      <text
        x={isLabelInside ? x + width - 5 : x + width + 5}
        y={y + height / 2}
        fill={isLabelInside ? "#fff" : "#666"}
        textAnchor={isLabelInside ? "end" : "start"}
        dominantBaseline="middle"
        className="text-xs font-semibold"
      >
        {labelText}
      </text>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Usando a altura dinâmica */}
        <div style={{ width: "100%", height: chartHeight }}>
          <ResponsiveContainer>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 0, left: 20, bottom: 5 }}
            >
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                width={90}
                tickLine={false}
                axisLine={false}
                tick={<CustomizedYAxisTick />}
                interval={0}
              />
              <Tooltip
                cursor={{ fill: "transparent" }}
                content={<CustomTooltip />}
              />
              <Bar dataKey="total" radius={[4, 4, 4, 4]} barSize={barThickness}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
                <LabelList dataKey="total" content={renderCustomizedLabel} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
