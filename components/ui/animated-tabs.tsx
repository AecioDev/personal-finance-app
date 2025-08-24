"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Tab = {
  label: string;
  value: string;
};

interface AnimatedTabsProps {
  tabs: Tab[];
  onValueChange: (value: string) => void;
  defaultValue: string;
  className?: string;
  tabClassName?: string;
  layoutId: string;
}

export function AnimatedTabs({
  tabs,
  onValueChange,
  defaultValue,
  className,
  tabClassName,
  layoutId,
}: AnimatedTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  const handleTabClick = (value: string) => {
    setActiveTab(value);
    onValueChange(value);
  };

  const tabWidthPercent = 100 / tabs.length;
  const padding = 8; // 8px de respiro, 4px de cada lado

  return (
    <div
      className={cn(
        "relative flex items-center rounded-full p-1 bg-muted",
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => handleTabClick(tab.value)}
          className={cn(
            // 1. Padding vertical reduzido para deixar o botão mais compacto
            "relative z-10 flex-1 rounded-full py-1.5 text-sm font-medium transition-colors duration-300",
            activeTab === tab.value
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground",
            tabClassName
          )}
        >
          {tab.label}
        </button>
      ))}
      <motion.div
        layoutId={layoutId}
        className="absolute inset-y-1 z-0 rounded-full bg-background"
        style={{
          left: `calc(${
            tabWidthPercent * tabs.findIndex((t) => t.value === activeTab)
          }% + ${padding / 2}px)`,
          width: `calc(${tabWidthPercent}% - ${padding}px)`,
        }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
      />
    </div>
  );
}
