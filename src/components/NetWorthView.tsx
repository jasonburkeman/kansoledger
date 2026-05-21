import React, { useMemo } from "react";
import { 
  Building, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  Scale, 
  Lightbulb 
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Transaction } from "../types";

interface NetWorthProps {
  transactions: Transaction[];
  monthlyData: { month: string; income: number; expenses: number }[];
}

export const NetWorthView: React.FC<NetWorthProps> = ({ transactions, monthlyData }) => {
  const calculations = useMemo(() => {
    let totalAssets = 85200; // Mock base assets for realistic demonstration
    let totalLiabilities = 15300; // Mock base liabilities for realistic demonstration

    // Integrate actual transactions into assets / liabilities:
    // Income increments assets, expenses decrement assets or increment liabilities.
    const realSavingsInput = transactions.reduce((acc, curr) => {
      if (curr.type === "income") return acc + Number(curr.amount);
      return acc - Number(curr.amount);
    }, 0);

    totalAssets += realSavingsInput > 0 ? realSavingsInput : 0;
    if (realSavingsInput < 0) {
      totalAssets += realSavingsInput; // subtract
    }

    const currentNetWorth = totalAssets - totalLiabilities;
    return {
      assets: totalAssets,
      liabilities: totalLiabilities,
      netWorth: currentNetWorth
    };
  }, [transactions]);

  // Transform monthly data into cumulative Net Worth growth
  const netWorthTrend = useMemo(() => {
    let cumulative = calculations.netWorth - 5000; // start slightly lower for trend
    
    // Default months if empty
    const monthsMock = monthlyData.length > 0 ? monthlyData : [
      { month: "Jan", income: 5000, expenses: 3800 },
      { month: "Feb", income: 6000, expenses: 4000 },
      { month: "Mar", income: 5500, expenses: 4100 },
      { month: "Apr", income: 7000, expenses: 4800 },
      { month: "May", income: 9557, expenses: 7963 }
    ];

    return monthsMock.map(m => {
      const surplus = m.income - m.expenses;
      cumulative += surplus;
      return {
        month: m.month,
        "Net Inflow": surplus,
        "Asset Valuation": cumulative
      };
    });
  }, [monthlyData, calculations.netWorth]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-sans font-semibold tracking-tight text-slate-900">Net Worth Growth</h1>
        <p className="text-slate-400 text-sm mt-0.5 font-medium">Coordinate your structural assets against current short-term liabilities</p>
      </div>

      {/* Stats indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border border-slate-100 rounded-3xl bg-white shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Total Net Assets</p>
            <h3 className="text-3xl font-sans font-extrabold tracking-tight text-slate-900">
              ${calculations.assets.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </h3>
            <p className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Fluid checking, investments, 401(k)</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl">
            🏦
          </div>
        </Card>

        <Card className="p-6 border border-slate-100 rounded-3xl bg-white shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Structural Liabilities</p>
            <h3 className="text-3xl font-sans font-extrabold tracking-tight text-slate-900">
              ${calculations.liabilities.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </h3>
            <p className="text-[11px] text-slate-400 font-bold mt-1">
              Credit card lines, student loan indices
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl">
            💳
          </div>
        </Card>

        <Card className="p-6 border border-slate-100 rounded-3xl bg-white shadow-xl shadow-slate-200/50 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Calculated Net Worth</p>
            <h3 className="text-3xl font-sans font-extrabold tracking-tight text-indigo-600">
              ${calculations.netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </h3>
            <p className="text-[11px] text-indigo-500 font-bold mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>On-target with expected plans!</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl">
            📈
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cumulative area linear chart (takes 2 columns) */}
        <div className="lg:col-span-2">
          <Card className="border border-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white h-[450px] flex flex-col justify-between">
            <CardHeader className="bg-white">
              <CardTitle className="text-lg font-sans font-bold text-slate-800">Net Wealth Accumulation</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow min-h-[300px] bg-white">
              <ResponsiveContainer width="100%" height="95%">
                <LineChart data={netWorthTrend} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`}
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
                    formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Valuation']}
                  />
                  <Line type="monotone" dataKey="Asset Valuation" name="Wealth Path" stroke="#4F46E5" strokeWidth={3.5} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Wealth recommendations & cards (takes 1 column) */}
        <div>
          <Card className="border border-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white h-full flex flex-col justify-between">
            <CardHeader className="bg-white">
              <CardTitle className="text-lg font-sans font-bold text-slate-800">Wealth Strategies</CardTitle>
            </CardHeader>
            <CardContent className="bg-white flex-grow flex flex-col justify-between">
              
              <div className="space-y-4 pt-2">
                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex gap-3.5 items-start">
                  <div className="p-2 bg-white rounded-xl shadow-sm text-indigo-600 flex-shrink-0">
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 text-[13px]">Consolidate Card Balances</h5>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                      Paying off short-term card lines with high yields will boost compound savings indexes instantly.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex gap-3.5 items-start">
                  <div className="p-2 bg-white rounded-xl shadow-sm text-emerald-600 flex-shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 text-[13px]">Compound Interest Path</h5>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                      Re-investing $200 of monthly surplus into index indices at 8% CAGR can yield $38,000 in 10 years.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4.5 bg-slate-50 border border-slate-100 rounded-2xl mt-6 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cash Flow Index</p>
                <div className="text-lg font-sans font-extrabold text-slate-800 mt-1">
                  1:1.4 Liquidity
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
