import React from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface TrendsChartProps {
  data: { month: string; income: number; expenses: number }[];
}

export const TrendsChart: React.FC<TrendsChartProps> = ({ data }) => {
  return (
    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl h-[400px] bg-white overflow-hidden">
      <CardHeader className="bg-white">
        <CardTitle className="text-xl font-serif tracking-tight text-natural-accent">Spending Trends</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px] bg-white">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
              />
              <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, color: '#94a3b8' }} />
              <Bar dataKey="income" name="Income" fill="#8A9A5B" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#5A5A40" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground italic">
            Import data to see trends
          </div>
        )}
      </CardContent>
    </Card>
  );
};
