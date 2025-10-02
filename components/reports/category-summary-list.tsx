// components/reports/category-summary-list.tsx
import { Icon } from "@iconify/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface CategorySummary {
  categoryId: string;
  name: string;
  icon: string;
  total: number;
  type: "income" | "expense";
}

interface CategorySummaryListProps {
  summary: CategorySummary[];
  title: string;
  total: number;
  type: "income" | "expense";
  // Nova prop para o clique
  onCategorySelect: (category: CategorySummary) => void;
}

export function CategorySummaryList({
  summary,
  title,
  total,
  type,
  onCategorySelect, // Nova prop
}: CategorySummaryListProps) {
  if (summary.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhuma {type === "income" ? "receita" : "despesa"} registrada neste
            mês.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {summary.map((item) => {
            const percentage = total > 0 ? (item.total / total) * 100 : 0;
            return (
              // Adicionado o onClick aqui
              <li
                key={item.categoryId}
                onClick={() => onCategorySelect(item)}
                className="cursor-pointer hover:bg-muted/50 p-2 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <Icon
                    icon={item.icon}
                    className="h-6 w-6 text-muted-foreground"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium">{item.name}</span>
                      <span
                        className={cn(
                          "font-semibold",
                          type === "income"
                            ? "text-green-500"
                            : "text-destructive"
                        )}
                      >
                        {item.total.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    </div>
                    <div className="relative h-2 w-full rounded-full bg-muted mt-1">
                      <div
                        className={cn(
                          "absolute h-2 rounded-full",
                          type === "income" ? "bg-green-500" : "bg-destructive"
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
