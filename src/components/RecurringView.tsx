import React, { useState } from "react";
import { 
  History, 
  Calendar, 
  Plus, 
  Check, 
  AlertTriangle, 
  Trash2, 
  X, 
  Info,
  DollarSign,
  Play,
  ArrowRight,
  TrendingDown
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "./ui/dialog";

interface RecurringItem {
  id: string;
  name: string;
  amount: number;
  dayOfMonth: number;
  category: string;
  icon: string;
  paidThisMonth: boolean;
}

interface RecurringViewProps {
  onAddTransaction: (t: { description: string; amount: number; type: "expense"; category: string; date: Date }) => void;
}

export const RecurringView: React.FC<RecurringViewProps> = ({ onAddTransaction }) => {
  const [subscriptions, setSubscriptions] = useState<RecurringItem[]>([
    { id: "sub1", name: "Netflix Premium", amount: 9.00, dayOfMonth: 21, category: "Entertainment", icon: "🎬", paidThisMonth: false },
    { id: "sub2", name: "WWF Donation", amount: 20.00, dayOfMonth: 22, category: "Charity", icon: "🐼", paidThisMonth: false },
    { id: "sub3", name: "Visa Card Prime", amount: 109.00, dayOfMonth: 23, category: "Financial", icon: "💳", paidThisMonth: false },
    { id: "sub4", name: "Google Cloud Sync", amount: 5.00, dayOfMonth: 24, category: "Utilities", icon: "☁️", paidThisMonth: false },
    { id: "sub5", name: "Gym Membership", amount: 29.47, dayOfMonth: 20, category: "Health & Fitness", icon: "💪", paidThisMonth: true },
    { id: "sub6", name: "Car Insurance", amount: 145.00, dayOfMonth: 5, category: "Insurance", icon: "🚗", paidThisMonth: true },
  ]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDay, setNewDay] = useState("15");
  const [newCategory, setNewCategory] = useState("Entertainment");
  const [newIcon, setNewIcon] = useState("📦");

  const totalMonthlyCount = subscriptions.length;
  const totalMonthlyCost = subscriptions.reduce((acc, curr) => acc + curr.amount, 0);
  const pendingCount = subscriptions.filter(s => !s.paidThisMonth).length;
  const pendingCost = subscriptions.filter(s => !s.paidThisMonth).reduce((acc, curr) => acc + curr.amount, 0);

  const handleMarkPaid = (item: RecurringItem) => {
    // 1. Toggle paid status in frontend
    setSubscriptions(prev => prev.map(s => s.id === item.id ? { ...s, paidThisMonth: true } : s));
    
    // 2. Auto-generate transaction in cashflow
    onAddTransaction({
      description: `${item.name} Payment`,
      amount: item.amount,
      type: "expense",
      category: "Bills & Utilities",
      date: new Date(2026, 4, item.dayOfMonth) // May 2026
    });
  };

  const handleCreateSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newAmount) return;

    const rate = Number(newAmount);
    if (isNaN(rate)) return;

    const item: RecurringItem = {
      id: "sub-" + Date.now(),
      name: newName,
      amount: rate,
      dayOfMonth: Number(newDay) || 15,
      category: newCategory,
      icon: newIcon,
      paidThisMonth: false
    };

    setSubscriptions(prev => [item, ...prev]);
    setIsAddOpen(false);

    // reset fields
    setNewName("");
    setNewAmount("");
    setNewDay("15");
    setNewCategory("Entertainment");
    setNewIcon("📦");
  };

  const handleDelete = (id: string) => {
    setSubscriptions(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-sans font-semibold tracking-tight text-slate-900">Recurring Charges</h1>
          <p className="text-slate-400 text-sm mt-0.5 font-medium">Manage continuous bills and subscription accounts</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger 
            render={
              <Button className="rounded-2xl bg-indigo-600 hover:bg-slate-900 text-white font-semibold flex items-center gap-2 self-start py-6 shadow-lg shadow-indigo-100 px-6">
                <Plus className="w-5 h-5" />
                Add Subscription
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md rounded-3xl border-none shadow-2xl p-8">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl font-bold text-slate-900">New Subscription</DialogTitle>
              <DialogDescription className="text-slate-500 text-sm leading-relaxed mt-1">
                Establish recurring expenses to auto-calculate the dashboard cashflow constraints.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateSub} className="space-y-5 pt-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5Col span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Subscription Name</label>
                  <Input 
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. Spotify Premium" 
                    className="rounded-xl h-11 text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Monthly Amount ($)</label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={newAmount}
                    onChange={e => setNewAmount(e.target.value)}
                    placeholder="14.99" 
                    className="rounded-xl h-11 text-slate-800"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Due Day (1-28)</label>
                  <Input 
                    type="number"
                    min="1"
                    max="28"
                    value={newDay}
                    onChange={e => setNewDay(e.target.value)}
                    className="rounded-xl h-11 text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Category</label>
                  <select 
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full rounded-xl h-11 border border-slate-200 bg-white px-3 text-slate-800 text-sm"
                  >
                    <option value="Entertainment">Entertainment</option>
                    <option value="Charity">Charity</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Financial">Financial</option>
                    <option value="Health & Fitness">Health & Fitness</option>
                    <option value="Food">Food</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Icon Emoji</label>
                  <Input 
                    value={newIcon}
                    onChange={e => setNewIcon(e.target.value)}
                    placeholder="🎵" 
                    maxLength={3}
                    className="rounded-xl h-11 text-slate-800"
                  />
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-xl">Cancel</Button>
                <Button type="submit" className="rounded-xl bg-indigo-600 text-white hover:bg-black font-semibold">Save Subscription</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid Status stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 border border-slate-100 rounded-3xl bg-white shadow-sm">
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Subscriptions Cost</p>
          <h3 className="text-3xl font-sans font-extrabold tracking-tight text-slate-900">${totalMonthlyCost.toFixed(2)}</h3>
          <p className="text-[11px] text-slate-400 font-bold block mt-1">across {totalMonthlyCount} total accounts</p>
        </Card>

        <Card className="p-6 border border-slate-100 rounded-3xl bg-white shadow-sm">
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Unpaid this month</p>
          <h3 className="text-3xl font-sans font-extrabold tracking-tight text-indigo-600">${pendingCost.toFixed(2)}</h3>
          <p className="text-[11px] text-slate-400 font-bold block mt-1">{pendingCount} charges currently pending</p>
        </Card>

        <Card className="p-6 border border-slate-100 rounded-3xl bg-orange-50/50 border-orange-100/50 shadow-sm col-span-2">
          <div className="flex gap-4 items-start">
            <div className="p-2.5 bg-orange-100 text-orange-600 rounded-2xl flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 text-[14px]">Upcoming Charge Alerts</h4>
              <p className="text-[12px] text-slate-500 leading-relaxed mt-1">
                Your <span className="font-bold text-slate-700">Netflix Premium ($9)</span> and <span className="font-bold text-slate-700">WWF Donation ($20)</span> charges are due in 1-2 days. Please ensure sufficient funds are active in your connected banks.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main List panel (takes 2 columns) */}
        <div className="lg:col-span-2">
          <Card className="border border-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-white">
              <CardTitle className="text-lg font-sans font-bold text-slate-800">Account Listing</CardTitle>
            </CardHeader>
            <CardContent className="p-0 bg-white">
              <div className="divide-y divide-slate-100">
                {subscriptions.map(s => (
                  <div key={s.id} className="p-5.5 hover:bg-slate-50/50 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-lg shadow-sm">
                        {s.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{s.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.category}</code>
                          <span className="text-[11px] text-slate-300 font-semibold">•</span>
                          <span className="text-[11px] text-slate-400 font-semibold">Due Day {s.dayOfMonth} of month</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="font-bold text-sm text-slate-900 block">${s.amount.toFixed(2)}</span>
                        
                        {s.paidThisMonth ? (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-1 inline-block">Paid</span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full mt-1 inline-block">Due</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {!s.paidThisMonth && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleMarkPaid(s)}
                            className="h-8 rounded-lg border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white flex items-center gap-1 font-bold text-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Mark Paid
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(s.id)}
                          className="h-8 w-8 p-0 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-lg transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar overview (takes 1 column) */}
        <div>
          <Card className="border border-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white h-full flex flex-col justify-between">
            <CardHeader className="bg-white">
              <CardTitle className="text-lg font-sans font-bold text-slate-800">Monthly Calendar</CardTitle>
            </CardHeader>
            <CardContent className="bg-white flex-grow flex flex-col justify-between">
              
              {/* Simplistic visual grid of due dates */}
              <div className="space-y-4 pt-2">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Historical Analytics</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-sans font-bold text-slate-900">May 2026</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Upcoming Sequence</p>
                  
                  {subscriptions.filter(s => !s.paidThisMonth).slice(0, 3).map(s => (
                    <div key={s.id} className="flex justify-between items-center text-xs p-2 border-b border-dashed border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{s.icon}</span>
                        <span className="font-semibold text-slate-700">{s.name}</span>
                      </div>
                      <span className="font-bold text-slate-500 text-[11px]">Day {s.dayOfMonth}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl mt-6 border border-slate-100 text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Optimization Summary</p>
                <p className="text-xs text-slate-500 italic mt-1.5 leading-relaxed">
                  Your bills sum to 12% of average earnings constraints. This is styled perfectly.
                </p>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
