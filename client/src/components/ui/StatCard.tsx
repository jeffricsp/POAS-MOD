import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

export function StatCard({ title, value, icon, trend, trendUp, className }: StatCardProps) {
  return (
    <div className={cn(
      "bg-card rounded-xl p-6 border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 group",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-3xl font-display font-bold tracking-tight text-foreground">{value}</h3>
        </div>
        <div className="p-2 bg-primary/5 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-2 text-xs">
          <span className={cn(
            "font-medium px-1.5 py-0.5 rounded",
            trendUp ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
          )}>
            {trend}
          </span>
          <span className="text-muted-foreground">vs last month</span>
        </div>
      )}
    </div>
  );
}
