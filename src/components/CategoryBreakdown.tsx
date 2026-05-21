import React from "react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  Legend
} from "recharts";
import { BudgetCategory } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface CategoryBreakdownProps {
  categories: BudgetCategory[];
}

const COLORS = ["#5A5A40", "#8A9A5B", "#D2B48C", "#B8860B", "#8B4513", "#CD853F", "#A0522D", "#6B8E23", "#556B2F", "#2F4F4F"];

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ categories }) => {
  const data = categories.map((c, i) => ({
    name: c.name,
    value: c.spent,
    color: COLORS[i % COLORS.length]
  })).sort((a, b) => b.value - a.value);

  return (
    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl h-full flex flex-col bg-white overflow-hidden">
      <CardHeader className="bg-white">
        <CardTitle className="text-xl font-serif tracking-tight text-natural-accent">Category Pulse</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-[300px] bg-white">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Spent']}
              />
              <Legend 
                verticalAlign="bottom" 
                align="center" 
                layout="horizontal"
                iconType="circle"
                wrapperStyle={{ paddingTop: '20px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground italic">
            Import data to see breakdown
          </div>
        )}
      </CardContent>
    </Card>
  );
};
