// in: components/ui/animated-tabs.tsx

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
  activeTabClassName?: string;
  layoutId: string;
}

export function AnimatedTabs({
  tabs,
  onValueChange,
  defaultValue,
  className,
  tabClassName,
  activeTabClassName,
  layoutId,
}: AnimatedTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  const handleTabClick = (value: string) => {
    setActiveTab(value);
    onValueChange(value);
  };

  const tabWidthPercent = 100 / tabs.length;
  const padding = 10;

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
          // A CORREÇÃO ESTÁ AQUI:
          type="button" // <<<<<<<<<<<<<<<<<<<<<<<<
          onClick={() => handleTabClick(tab.value)}
          className={cn(
            "relative z-10 flex-1 rounded-full py-1.5 text-sm font-medium transition-colors duration-300",
            activeTab === tab.value
              ? "text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
            tabClassName
          )}
        >
          {tab.label}
        </button>
      ))}
      <motion.div
        layoutId={layoutId}
        className={cn(
          "absolute inset-y-1 z-0 rounded-full bg-primary",
          activeTabClassName
        )}
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
