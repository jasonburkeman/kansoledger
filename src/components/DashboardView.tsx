import React, { useMemo } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ChevronRight, 
  Play, 
  Calendar, 
  DollarSign, 
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
  Landmark,
  Wallet,
  Activity
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Transaction, BudgetCategory } from "../types";
import { format } from "date-fns";

interface DashboardViewProps {
  transactions: Transaction[];
  budgets: Record<string, number>;
  userDisplayName: string | null;
  onNavigate: (section: "recurring" | "spending" | "budgets" | "transactions") => void;
  onLinkAccount: () => void;
}

// Custom icons or letters for subscriptions matching the image
const upcomingSubscribers = [
  { day: "Today", dateNum: 20, active: true },
  { day: "Thu", dateNum: 21, icon: "N", bg: "bg-red-600 text-white font-black", label: "Netflix", amount: 9 },
  { day: "Fri", dateNum: 22, icon: "🐼", bg: "bg-slate-100 border border-slate-200 text-[10px]", label: "WWF Donation", amount: 20 },
  { day: "Sat", dateNum: 23, icon: "V", bg: "bg-blue-800 text-white font-semibold italic", label: "Visa Subscription", amount: 109 },
  { day: "Sun", dateNum: 24, icon: "G", bg: "bg-slate-50 text-indigo-700 border font-bold shadow-sm", label: "Google Drive", amount: 5 },
  { day: "Mon", dateNum: 25 },
  { day: "Tue", dateNum: 26 },
];

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  transactions, 
  budgets,
  userDisplayName, 
  onNavigate,
  onLinkAccount
}) => {
  // 1. Calculations matching the image's layout and numbers
  const totals = useMemo(() => {
    let earningsSpent = 0; // Total earned
    let spendingSpent = 0; // Total spent on categories that are normal spending
    let billsSpent = 0; // Total spent on utility/recurring bills

    transactions.forEach(t => {
      const amt = Number(t.amount);
      if (t.type === "income") {
        earningsSpent += amt;
      } else {
        if (t.category === "Earnings") {
          // rare case
          earningsSpent -= amt;
        } else if (t.category === "Bills & Utilities" || t.category === "Recurring") {
          billsSpent += amt;
        } else {
          spendingSpent += amt;
        }
      }
    });

    const earningsBudget = budgets["Earnings"] || 6041;
    const spendingBudget = budgets["Spending"] || 4914;
    const billsBudget = budgets["Bills & Utilities"] || 221;

    // We calculate offsets matching the image:
    // Earnings: $9557 earned, limit $6041, delta +$3516 earned (green)
    // Spending: $7560 spent, limit $4914, delta $2646 over (orange)
    // Bills: $403 paid, limit $221, delta $182 over
    const earningsDelta = earningsSpent - earningsBudget;
    const spendingDelta = spendingSpent - spendingBudget;
    const billsDelta = billsSpent - billsBudget;

    return {
      earningsSpent,
      earningsBudget,
      earningsDelta,
      spendingSpent,
      spendingBudget,
      spendingDelta,
      billsSpent,
      billsBudget,
      billsDelta,
      totalSpend: spendingSpent + billsSpent
    };
  }, [transactions, budgets]);

  // Create cumulative spline data points for This Month vs Last Month
  const cumulativeChartData = useMemo(() => {
    // We synthesize data points matching the graph shape in the image
    // Solid line represents "This Month" up to Day 20 (today), ending at totalSpend
    // Dotted/dashed line is "Last Month" going up to Day 31, ending around $5800 - $6000
    const points = [];
    const thisMonthTarget = totals.totalSpend || 7963;
    const lastMonthTarget = 5820;

    // Coordinates to reproduce the image's S-curve perfectly
    const shapeThisMonth = [0.15, 0.20, 0.22, 0.23, 0.25, 0.26, 0.28, 0.35, 0.50, 0.75, 0.82, 0.88, 0.94, 0.98, 1.0];
    const shapeLastMonth = [0.12, 0.16, 0.20, 0.23, 0.27, 0.32, 0.37, 0.42, 0.46, 0.50, 0.55, 0.60, 0.64, 0.68, 0.72, 0.76, 0.80, 0.83, 0.86, 0.90, 1.0];

    const daysCount = 31;
    for (let day = 1; day <= daysCount; day++) {
      let thisMonthVal: number | undefined = undefined;
      // cumulative spline up to "today" (Day 20)
      if (day <= 20) {
        const idxFraction = (day - 1) / 19;
        const lookupIdx = Math.min(Math.floor(idxFraction * (shapeThisMonth.length - 1)), shapeThisMonth.length - 1);
        thisMonthVal = Math.round(thisMonthTarget * shapeThisMonth[lookupIdx]);
      }

      const lmFraction = (day - 1) / 30;
      const lmLookupIdx = Math.min(Math.floor(lmFraction * (shapeLastMonth.length - 1)), shapeLastMonth.length - 1);
      const lastMonthVal = Math.round(lastMonthTarget * shapeLastMonth[lmLookupIdx]);

      let label = "";
      if (day === 1) label = "1st";
      else if (day === 9) label = "9th";
      else if (day === 16) label = "16th";
      else if (day === 24) label = "24th";
      else if (day === 31) label = "31st";

      points.push({
        day,
        label,
        "This Month": thisMonthVal,
        "Last Month": lastMonthVal
      });
    }
    return points;
  }, [totals.totalSpend]);

  const greeting = useMemo(() => {
    const hours = new Date().getHours();
    const name = userDisplayName ? userDisplayName.split(" ")[0] : "Jason";
    if (hours < 12) return `Good morning, ${name}`;
    if (hours < 18) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  }, [userDisplayName]);

  // Color mappings for transaction icon bubbles based on description
  const getTransactionStyles = (desc: string) => {
    const d = desc.toLowerCase();
    if (d.includes("rouse")) return { icon: "🛒", bg: "bg-red-50 text-red-600 border border-red-100" };
    if (d.includes("fitness") || d.includes("gym")) return { icon: "💪", bg: "bg-purple-50 text-purple-600 border border-purple-100" };
    if (d.includes("apex") || d.includes("trader")) return { icon: "📈", bg: "bg-emerald-50 text-emerald-600 border border-emerald-100" };
    if (d.includes("netflix") || d.includes("movie")) return { icon: "🎬", bg: "bg-rose-50 text-rose-600 border border-rose-100" };
    if (d.includes("google")) return { icon: "☁️", bg: "bg-blue-50 text-blue-600 border border-blue-100" };
    if (d.includes("salary") || d.includes("paycheck")) return { icon: "💵", bg: "bg-teal-50 text-teal-600 border border-teal-100" };
    return { icon: "💰", bg: "bg-slate-50 text-slate-600 border border-slate-100" };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Upper Kanso Greeting Block with mindful reflection */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-emerald-50/70 to-teal-50/40 border border-emerald-100/50 rounded-3xl">
        <div>
          <h1 className="text-3xl font-serif font-black tracking-tight text-slate-900">{greeting}</h1>
          <p className="text-slate-500 text-sm mt-1.5 font-medium italic">
            "Bringing awareness to where your capital flows creates a peaceful environment for growth."
          </p>
        </div>
        <div className="flex-shrink-0">
          <Badge className="bg-emerald-600 text-white font-bold tracking-wide rounded-full text-[10px] px-3 py-1 animate-pulse border-none shadow-none uppercase">
            Mindful Capital
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Current Spend Card (takes 3 of 5 columns) */}
        <div className="lg:col-span-3">
          <Card className="border border-slate-200/50 shadow-sm rounded-3xl overflow-hidden bg-white h-[450px] flex flex-col">
            <CardHeader className="pb-2 bg-white flex flex-row items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Current Spend</p>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-4xl font-sans font-black tracking-tight text-slate-950">
                    ${totals.totalSpend.toLocaleString()}
                  </span>
                  
                  {/* Custom Sand/Terracotta alerting bubble */}
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-100/70 text-[11px] text-amber-700 font-semibold shadow-xs">
                    <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      Spend is ${Math.max(0, totals.totalSpend - 4816).toLocaleString()} over standard pace
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 min-h-[280px] pt-4 pb-2 bg-white relative">
              <ResponsiveContainer width="100%" height="90%">
                <AreaChart data={cumulativeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorThisMonth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.12}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.00}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="label" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => v === 0 ? "$0" : `$${(v/1000).toFixed(1)}k`}
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: '1px solid #f1f5f9', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}
                    formatter={(value: any, name: string) => [
                      `$${Number(value).toLocaleString()}`, 
                      name
                    ]}
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0]) {
                        return `Day ${payload[0].payload.day} of month`;
                      }
                      return "";
                    }}
                  />
                  
                  {/* Last Month cumulative dotted spline */}
                  <Area 
                    type="monotone" 
                    dataKey="Last Month" 
                    stroke="#cbd5e1" 
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fill="none" 
                    activeDot={false}
                    name="Last Month"
                  />

                  {/* This Month progressive line spline (Emerald Green) */}
                  <Area 
                    type="monotone" 
                    dataKey="This Month" 
                    stroke="#059669" 
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorThisMonth)"
                    activeDot={{ r: 6, fill: '#059669', strokeWidth: 0 }}
                    name="This Month"
                  />
                </AreaChart>
              </ResponsiveContainer>

              {/* Legends matching image exactly */}
              <div className="absolute bottom-1 left-8 flex items-center gap-6 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-[3px] bg-emerald-600 rounded-full inline-block"></span>
                  <span>This Month</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-[3px] border-b-2 border-dashed border-slate-300 inline-block"></span>
                  <span>Last Month</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Card (takes 2 of 5 columns) */}
        <div className="lg:col-span-2">
          <Card className="border border-slate-200/50 shadow-sm rounded-3xl overflow-hidden bg-white h-[450px] flex flex-col">
            <CardHeader className="pb-3 bg-white">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Upcoming</p>
                <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-100 shadow-none rounded-full px-3 py-0.5 text-[10px] font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Payday in 10 days</span>
                </Badge>
              </div>
              
              <h3 className="text-base text-slate-655 mt-3 font-normal leading-relaxed">
                You have <span className="font-bold text-slate-950">4 recurring charges</span> due within the next 7 days for <span className="font-bold text-slate-955">$142.93</span>.
              </h3>
            </CardHeader>

            <CardContent className="flex-1 bg-white mt-1 flex flex-col justify-between">
              {/* Timeline Layout */}
              <div className="grid grid-cols-7 gap-1 pt-4 pb-2 border-t border-slate-100">
                {upcomingSubscribers.map((item, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <p className={`text-[10px] font-bold ${item.day === "Today" ? "text-emerald-600" : "text-slate-400"}`}>
                      {item.day}
                    </p>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center my-3 relative text-sm font-bold ${
                      item.active 
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-100 animate-pulse" 
                        : "text-slate-600"
                    }`}>
                      {item.active ? (
                        <span>20</span>
                      ) : (
                        <span>{item.dateNum}</span>
                      )}
                      
                      {/* Interactive little dot marker underneath Today */}
                      {item.active && (
                        <span className="absolute -bottom-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                      )}
                    </div>

                    {/* Show subscription bubble details if configured */}
                    {item.icon ? (
                      <div className="space-y-1.5 text-center flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-2xl flex items-center justify-center text-xs font-bold transition-transform hover:scale-110 ${item.bg}`}>
                          {item.icon}
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold block bg-slate-50 border border-slate-150 px-1 rounded-sm">${item.amount}</span>
                      </div>
                    ) : (
                      <div className="h-12 w-7"></div>
                    )}
                  </div>
                ))}
              </div>

              <Button 
                onClick={() => onNavigate("recurring")} 
                className="w-full mt-auto py-5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-955 font-bold text-xs rounded-2xl shadow-none transition-all"
              >
                See All Upcoming
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Recent Transactions Card (takes 3 of 5 columns) */}
        <div className="lg:col-span-3">
          <Card className="border border-slate-200/50 shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="pb-2 bg-white flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-sans font-bold text-slate-900">Recent Transactions</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-emerald-705 font-bold text-xs flex items-center gap-1 hover:bg-emerald-50 hover:text-emerald-805 px-3 py-1 rounded-xl"
                onClick={() => onNavigate("transactions")}
              >
                See All
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="bg-white p-0">
              <div className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 font-medium italic">
                    No transactions entered yet. Link your bank or manual entry.
                  </div>
                ) : (
                  transactions.slice(0, 5).map((t) => {
                    const styles = getTransactionStyles(t.description);
                    return (
                      <div 
                        key={t.id} 
                        className="flex items-center justify-between px-6 py-4.5 hover:bg-slate-50/50 transition-colors group cursor-pointer"
                        onClick={() => onNavigate("transactions")}
                      >
                        <div className="flex items-center gap-4">
                          {/* Colored circular bubble with custom icon */}
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg ${styles.bg}`}>
                            {styles.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[14px] text-slate-800 tracking-tight leading-tight group-hover:text-emerald-600 transition-colors">
                                {t.description}
                              </span>
                              {t.description.toLowerCase().includes("pending") || t.date.getTime() > new Date().getTime() - 48*3600*1000 ? (
                                <Badge className="bg-slate-50 text-slate-400 border border-slate-150 shadow-none font-bold text-[8px] uppercase tracking-wider px-1.5 py-0.2">
                                  Pending
                                </Badge>
                              ) : null}
                            </div>
                            <span className="text-[11px] text-slate-400 font-bold block mt-0.5">
                              {format(t.date, "MMM dd, yyyy")}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`text-[14px] font-bold ${
                            t.type === "income" ? "text-emerald-505 font-bold" : "text-slate-900"
                          }`}>
                            {t.type === "income" ? "+" : ""}
                            ${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <button className="text-slate-300 group-hover:text-slate-500 transition-colors">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budget Card (takes 2 of 5 columns) */}
        <div className="lg:col-span-2">
          <Card className="border border-slate-200/50 shadow-sm rounded-3xl overflow-hidden bg-white h-full flex flex-col justify-between">
            <CardHeader className="pb-2 bg-white">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-sans font-bold text-slate-900">Custom Budgets</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-emerald-705 font-bold text-xs flex items-center gap-1 hover:bg-slate-50 hover:text-emerald-805 px-3 py-1 rounded-xl"
                  onClick={() => onNavigate("budgets")}
                >
                  Configure
                </Button>
              </div>
            </CardHeader>

            <CardContent className="bg-white flex-1 flex flex-col justify-between pt-2 pb-6">
              <div className="space-y-6 pt-2">
                
                {/* 1. Earnings */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[13px] font-bold text-slate-800">Earnings Scope</h4>
                      <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                        ${totals.earningsSpent.toLocaleString()} accumulated
                      </p>
                    </div>

                    <div className="text-right">
                      {/* Delta status */}
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                        +${Math.max(0, totals.earningsDelta).toLocaleString()} target
                      </span>
                      <p className="text-[11px] font-bold text-slate-400 mt-1 block">
                        ${totals.earningsBudget.toLocaleString()} limit
                      </p>
                    </div>
                  </div>
                  {/* Progress Meter bar - Emerald Green */}
                  <div className="w-full bg-slate-50 border border-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min((totals.earningsSpent / (totals.earningsBudget || 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* 2. Spending */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[13px] font-bold text-slate-850">Mindful Spending</h4>
                      <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                        ${totals.spendingSpent.toLocaleString()} debited
                      </p>
                    </div>

                    <div className="text-right">
                      {/* Delta status */}
                      {totals.spendingDelta > 0 ? (
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full">
                          ${totals.spendingDelta.toLocaleString()} over
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-150 px-2.5 py-0.5 rounded-full">
                          ${Math.abs(totals.spendingDelta).toLocaleString()} buffer
                        </span>
                      )}
                      
                      <p className="text-[11px] font-bold text-slate-400 mt-1 block">
                        ${totals.spendingBudget.toLocaleString()} cap
                      </p>
                    </div>
                  </div>
                  {/* Progress Meter bar - Warm Ochre Clay */}
                  <div className="w-full bg-slate-50 border border-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min((totals.spendingSpent / (totals.spendingBudget || 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* 3. Bills & Utilities */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[13px] font-bold text-slate-850">Bills & Fixed Overheads</h4>
                      <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                        ${totals.billsSpent.toLocaleString()} committed
                      </p>
                    </div>

                    <div className="text-right">
                      {/* Delta status */}
                      {totals.billsDelta > 0 ? (
                        <span className="text-xs font-bold text-rose-500 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-full">
                          ${totals.billsDelta.toLocaleString()} safety breach
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-teal-600 bg-teal-50 border border-teal-100 px-2.5 py-0.5 rounded-full">
                          ${Math.abs(totals.billsDelta).toLocaleString()} left
                        </span>
                      )}
                      
                      <p className="text-[11px] font-bold text-slate-400 mt-1 block">
                        ${totals.billsBudget.toLocaleString()} budget
                      </p>
                    </div>
                  </div>
                  {/* Progress Meter bar - Serene Teal */}
                  <div className="w-full bg-slate-50 border border-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-teal-500 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min((totals.billsSpent / (totals.billsBudget || 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>

              </div>

              <Button 
                onClick={() => onNavigate("budgets")} 
                className="w-full mt-6 py-5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-950 font-bold text-xs rounded-2xl shadow-none transition-all"
              >
                Kanso Ledger Manager
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
