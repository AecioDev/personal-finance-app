// components/reports/category-entries-sheet.tsx
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { FinancialEntry } from "@/interfaces/financial-entry";
import { CategorySummary } from "./category-summary-list";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Icon } from "@iconify/react";
import { ScrollArea } from "../ui/scroll-area";

interface CategoryEntriesSheetProps {
  selectedCategory: CategorySummary | null;
  onClose: () => void;
  month: Date;
  entries: FinancialEntry[];
}

export function CategoryEntriesSheet({
  selectedCategory,
  onClose,
  month,
  entries,
}: CategoryEntriesSheetProps) {
  if (!selectedCategory) return null;

  const formattedMonth = format(month, "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <Sheet open={!!selectedCategory} onOpenChange={onClose}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Icon icon={selectedCategory.icon} className="h-6 w-6" />
            {selectedCategory.name}
          </SheetTitle>
          <SheetDescription>
            Lançamentos realizados em {formattedMonth}.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-3 py-4">
            {entries.length > 0 ? (
              entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-semibold">{entry.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(entry.paymentDate!), "dd/MM/yyyy")}
                    </p>
                  </div>
                  <p
                    className={`font-bold ${
                      selectedCategory.type === "income"
                        ? "text-green-500"
                        : "text-destructive"
                    }`}
                  >
                    {(entry.paidAmount || 0).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                Nenhum lançamento encontrado para esta categoria no período.
              </p>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
