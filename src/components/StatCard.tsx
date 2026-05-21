import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { cn } from "../lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  description, 
  icon, 
  trend,
  className 
}) => {
  return (
    <Card className={cn("overflow-hidden border-none rounded-2xl shadow-sm bg-white", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0 text-slate-400">
        <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em]">
          {title}
        </CardTitle>
        <div className="p-2.5 bg-slate-50 rounded-xl shadow-inner">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-serif font-bold tracking-tight text-natural-accent">{value}</div>
        {(description || trend) && (
          <p className="text-xs pt-2 flex items-center gap-1.5">
            {trend && (
              <span className={cn(
                "font-bold px-1.5 py-0.5 rounded-md",
                trend.isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              )}>
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
            )}
            <span className="text-slate-400 italic">{description}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
};
