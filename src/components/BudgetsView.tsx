import React, { useState, useEffect } from "react";
import { 
  PiggyBank, 
  Settings, 
  Check, 
  AlertTriangle, 
  Sparkles, 
  BadgeHelp,
  Save,
  PenTool,
  ArrowRight,
  TrendingUp,
  Sliders
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";

interface BudgetsViewProps {
  budgets: Record<string, number>;
  transactions: Transaction[];
  onSaveBudgets: (newBudgets: Record<string, number>) => Promise<void>;
}

import { Transaction } from "../types";

export const BudgetsView: React.FC<BudgetsViewProps> = ({ budgets, transactions, onSaveBudgets }) => {
  // Aggregate real-time spend on standard buckets
  const computedSpent = React.useMemo(() => {
    let earnings = 0;
    let spending = 0;
    let bills = 0;

    transactions.forEach(t => {
      const amt = Number(t.amount);
      if (t.type === "income") {
        earnings += amt;
      } else {
        if (t.category === "Earnings") {
          earnings -= amt;
        } else if (t.category === "Bills & Utilities" || t.category === "Recurring") {
          bills += amt;
        } else {
          spending += amt;
        }
      }
    });

    return {
      Earnings: earnings,
      Spending: spending,
      "Bills & Utilities": bills
    };
  }, [transactions]);

  // Editor states
  const [earningsLimit, setEarningsLimit] = useState("");
  const [spendingLimit, setSpendingLimit] = useState("");
  const [billsLimit, setBillsLimit] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savingSuccess, setSavingSuccess] = useState(false);

  // Sync state with incoming props
  useEffect(() => {
    setEarningsLimit((budgets["Earnings"] || 6041).toString());
    setSpendingLimit((budgets["Spending"] || 4914).toString());
    setBillsLimit((budgets["Bills & Utilities"] || 221).toString());
  }, [budgets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavingSuccess(false);

    try {
      const updated = {
        Earnings: Number(earningsLimit) || 6041,
        Spending: Number(spendingLimit) || 4914,
        "Bills & Utilities": Number(billsLimit) || 221
      };
      await onSaveBudgets(updated);
      setSavingSuccess(true);
      setTimeout(() => setSavingSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const categories = [
    {
      key: "Earnings",
      title: "Expected Income / Earnings",
      spent: computedSpent.Earnings,
      defaultLimit: 6041,
      desc: "Salary paychecks, investments, dividends, side hustle deposits...",
      isEarn: true
    },
    {
      key: "Spending",
      title: "Personal spending / Groceries & Luxuries",
      spent: computedSpent.Spending,
      defaultLimit: 4914,
      desc: "Markets, anytime fitness, streaming subscriptions, food, gas, dining...",
      isEarn: false
    },
    {
      key: "Bills & Utilities",
      title: "Utility Bills & Fixed Costs",
      spent: computedSpent.Earnings, // Wait! Bills is computedSpent["Bills & Utilities"]
      defaultLimit: 221,
      desc: "Power grids, heating systems, recurring insurances, rent contracts...",
      isEarn: false,
      useBillsSpent: true // helper
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-sans font-semibold tracking-tight text-slate-900">Budgets Core</h1>
        <p className="text-slate-400 text-sm mt-0.5 font-medium">Fine-tune cash allowances and aggregate spending limits</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Editor panel (takes 1 column) */}
        <div>
          <Card className="border border-slate-100 shadow-sm rounded-3xl bg-white sticky top-10 overflow-hidden">
            <CardHeader className="bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Sliders className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg font-sans font-bold text-slate-800">Adjust Allowances</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="bg-white">
              <form onSubmit={handleSubmit} className="space-y-5">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Earnings Target ($)</label>
                  <Input 
                    type="number" 
                    value={earningsLimit} 
                    onChange={e => setEarningsLimit(e.target.value)}
                    className="rounded-xl h-11 border-slate-200 text-slate-800 focus:ring-indigo-500 font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Spending Limit ($)</label>
                  <Input 
                    type="number" 
                    value={spendingLimit} 
                    onChange={e => setSpendingLimit(e.target.value)}
                    className="rounded-xl h-11 border-slate-200 text-slate-800 focus:ring-indigo-500 font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Bills & Utilities ($)</label>
                  <Input 
                    type="number" 
                    value={billsLimit} 
                    onChange={e => setBillsLimit(e.target.value)}
                    className="rounded-xl h-11 border-slate-200 text-slate-800 focus:ring-indigo-500 font-semibold"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="w-full h-11 mt-6 rounded-xl bg-indigo-600 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <span>Saving...</span>
                  ) : savingSuccess ? (
                    <span className="flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      Limits Synchronized!
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Save className="w-4 h-4" />
                      Confirm Limits
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Dynamic Tracking displays (takes 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          {categories.map((c, idx) => {
            const actualLimit = Number(c.key === "Earnings" ? earningsLimit : c.key === "Spending" ? spendingLimit : billsLimit) || c.defaultLimit;
            const actualSpent = c.useBillsSpent ? computedSpent["Bills & Utilities"] : c.spent;
            const percentageVal = Math.round((actualSpent / (actualLimit || 1)) * 100);
            
            // Determine status badge:
            // "On Track" or "Exceeded Allowance" or "High Performance"
            let badgeStyle = "bg-slate-50 text-slate-600 border border-slate-100";
            let badgeLabel = "On Track";

            if (c.isEarn) {
              if (actualSpent >= actualLimit) {
                badgeStyle = "bg-emerald-50 text-emerald-600 border border-emerald-100";
                badgeLabel = "Goal Surpassed";
              } else {
                badgeStyle = "bg-orange-50 text-orange-600 border border-orange-100";
                badgeLabel = "Accumulating";
              }
            } else {
              if (actualSpent > actualLimit) {
                badgeStyle = "bg-rose-50 text-rose-600 border border-rose-100";
                badgeLabel = "Budget Exceeded";
              } else if (percentageVal > 85) {
                badgeStyle = "bg-orange-50 text-orange-600 border border-orange-100";
                badgeLabel = "Warning Zone";
              } else {
                badgeStyle = "bg-emerald-50 text-emerald-600 border border-emerald-100";
                badgeLabel = "On Track";
              }
            }

            return (
              <Card key={idx} className="border border-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800 text-base">{c.key}</h3>
                      <Badge className={`rounded-full text-[9px] uppercase font-bold tracking-wider px-2 shadow-none py-0.5 ${badgeStyle}`}>
                        {badgeLabel}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{c.desc}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-sans font-bold text-slate-900 block">
                      ${actualSpent.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
                      of ${actualLimit.toLocaleString()} limit ({percentageVal}%)
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-50 h-3 rounded-full mt-5 overflow-hidden border border-slate-100 relative">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      c.isEarn 
                        ? "bg-emerald-500" 
                        : percentageVal > 100 
                          ? "bg-rose-500" 
                          : percentageVal > 85 
                            ? "bg-orange-500" 
                            : "bg-indigo-600"
                    }`}
                    style={{ width: `${Math.min(percentageVal, 100)}%` }}
                  />
                </div>

                {/* dynamic difference explanation text */}
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-tight mt-3">
                  {c.isEarn ? (
                    actualSpent >= actualLimit ? (
                      <span className="text-emerald-500">
                        +${(actualSpent - actualLimit).toLocaleString()} above target!
                      </span>
                    ) : (
                      <span className="text-slate-400">
                        ${(actualLimit - actualSpent).toLocaleString()} remaining to target
                      </span>
                    )
                  ) : (
                    actualSpent > actualLimit ? (
                      <span className="text-rose-500">
                        ${(actualSpent - actualLimit).toLocaleString()} overspent limit!
                      </span>
                    ) : (
                      <span className="text-emerald-500">
                        ${(actualLimit - actualSpent).toLocaleString()} available allowance remaining
                      </span>
                    )
                  )}
                  <span>{percentageVal > 100 ? "Limit Exceeded" : `${100 - Math.min(percentageVal, 100)}% remaining`}</span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
