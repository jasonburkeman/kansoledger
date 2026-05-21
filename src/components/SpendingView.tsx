import React, { useState, useMemo } from "react";
import { 
  TrendingUp, 
  Calendar, 
  Search, 
  Filter, 
  ShoppingBag, 
  Coffee, 
  Home, 
  Car, 
  Tv, 
  Zap, 
  DollarSign 
} from "lucide-react";
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
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Transaction } from "../types";
import { CategoryBreakdown } from "./CategoryBreakdown";

interface SpendingProps {
  transactions: Transaction[];
}

export const SpendingView: React.FC<SpendingProps> = ({ transactions }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const expensesOnly = useMemo(() => {
    return transactions.filter(t => t.type === "expense");
  }, [transactions]);

  // Aggregate category spent data for list & pie chart
  const categoriesList = useMemo(() => {
    const list: Record<string, number> = {};
    expensesOnly.forEach(t => {
      list[t.category] = (list[t.category] || 0) + Number(t.amount);
    });
    return Object.entries(list).map(([name, spent]) => ({
      name,
      spent,
      budget: 0,
      color: "hsl(var(--primary))"
    })).sort((a,b) => b.spent - a.spent);
  }, [expensesOnly]);

  const filteredTransactions = useMemo(() => {
    return expensesOnly.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "All" || t.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [expensesOnly, searchTerm, selectedCategory]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-sans font-semibold tracking-tight text-slate-900">Spending Analysis</h1>
        <p className="text-slate-400 text-sm mt-0.5 font-medium">Uncover patterns and category pulses in your transactions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Visual Pulse column (takes 1 col) */}
        <div>
          <CategoryBreakdown categories={categoriesList} />
        </div>

        {/* Detailed Bar Chart showing individual items/days listing (takes 2 cols) */}
        <div className="lg:col-span-2">
          <Card className="border border-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white h-full flex flex-col justify-between">
            <CardHeader className="bg-white">
              <CardTitle className="text-lg font-sans font-bold text-slate-800">Expense Concentrations</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow min-h-[300px] bg-white">
              <ResponsiveContainer width="100%" height="95%">
                <BarChart data={categoriesList} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={(v) => `$${v}`}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}
                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Spent']}
                  />
                  <Bar dataKey="spent" name="Spent" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Expense ledger search & sorting section */}
      <Card className="border border-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white">
        <CardHeader className="bg-white flex flex-col md:flex-row md:items-center justify-between pb-4 gap-4">
          <CardTitle className="text-lg font-sans font-bold text-slate-800">Category Specific Ledger</CardTitle>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search transactions..."
                className="pl-10 h-10 w-full sm:w-60 rounded-xl"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 font-medium text-slate-700 text-xs w-full sm:w-48"
            >
              <option value="All">All Categories</option>
              {categoriesList.map(cat => (
                <option key={cat.name} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0 bg-white">
          <div className="divide-y divide-slate-100">
            {filteredTransactions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-medium italic">
                No matching expenses found. Adjust filters or search keywords.
              </div>
            ) : (
              filteredTransactions.map(t => (
                <div key={t.id} className="p-5 flex items-center justify-between hover:bg-slate-50/20 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-base shadow-sm">
                      💸
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 text-[14px]">{t.description}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-indigo-50 text-indigo-600 border border-indigo-100/30 font-bold text-[9px] uppercase shadow-none px-2 py-0.2">
                          {t.category}
                        </Badge>
                        <span className="text-[11px] text-slate-400 font-bold">
                          {new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="font-extrabold text-[14px] text-slate-900">
                    -${Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
