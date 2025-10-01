// in: components/dashboard/accounts-carousel.tsx
"use client";

import React from "react";
import { Account } from "@/interfaces/finance";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

interface AccountsCarouselProps {
  accounts: Account[];
}

export function AccountsCarousel({ accounts }: AccountsCarouselProps) {
  if (!accounts || accounts.length === 0) {
    return null;
  }

  return (
    <div className="px-4">
      <h2 className="text-sm font-semibold text-muted-foreground mb-2 px-2">
        Saldos em Conta
      </h2>
      <Carousel
        opts={{
          align: "start",
          dragFree: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2">
          {accounts.map((account) => (
            <CarouselItem
              key={account.id}
              className="pl-2 basis-1/2 md:basis-1/3"
            >
              <div className="p-1">
                <Card className="shadow-sm bg-muted text-muted-foreground">
                  <CardContent className="flex flex-col items-center justify-center p-3 space-y-1">
                    <div className="flex items-center gap-2 w-full justify-center">
                      <Icon
                        icon={account.icon || "fa6-solid:piggy-bank"}
                        className="w-4 h-4 text-muted-foreground flex-shrink-0"
                      />
                      <p className="text-sm font-semibold truncate min-w-0">
                        {account.name}
                      </p>
                    </div>
                    <p
                      className={cn(
                        "text-lg font-bold font-numeric",
                        (account.balance || 0) < 0
                          ? "text-destructive"
                          : "text-foreground"
                      )}
                    >
                      {(account.balance || 0).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
