import React, { useState, useMemo, useEffect, useCallback } from "react";
import { 
  Wallet, 
  TrendingUp, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Calendar,
  Layers,
  LayoutDashboard,
  PieChart as PieChartIcon,
  CreditCard,
  Plus,
  Landmark,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Settings,
  LogOut,
  ChevronRight,
  TrendingDown,
  Activity,
  Smartphone,
  Sparkles,
  MessageSquare,
  Sparkle,
  Menu,
  X
} from "lucide-react";
import { Transaction, BudgetSummary, BudgetCategory } from "./types";
import { FileUpload } from "./components/FileUpload";
import { StatCard } from "./components/StatCard";
import { TransactionTable } from "./components/TransactionTable";
import { CategoryBreakdown } from "./components/CategoryBreakdown";
import { TrendsChart } from "./components/TrendsChart";
import { Insights } from "./components/Insights";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Button } from "./components/ui/button";
import { Separator } from "./components/ui/separator";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "./components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { cn } from "./lib/utils";
import { usePlaidLink } from 'react-plaid-link';
import { useAuth } from "./lib/auth";
import { db, handleFirestoreError, OperationType } from "./lib/firebase";
import { 
  collection, 
  query, 
  onSnapshot, 
  writeBatch, 
  doc, 
  serverTimestamp,
  deleteDoc,
  getDocs,
  setDoc
} from "firebase/firestore";

// High-quality modular subviews
import { DashboardView } from "./components/DashboardView";
import { RecurringView } from "./components/RecurringView";
import { SpendingView } from "./components/SpendingView";
import { BudgetsView } from "./components/BudgetsView";
import { NetWorthView } from "./components/NetWorthView";
import { CreditScoreView } from "./components/CreditScoreView";
import { FeatureSuggester } from "./components/FeatureSuggester";
import { ChatAdvisor } from "./components/ChatAdvisor";

export default function App() {
  const { user, loading: authLoading, signInWithGoogle, logout } = useAuth();
  
  // Navigation: matches sidebar links on image
  const [activeSection, setActiveSection] = useState<'dashboard' | 'recurring' | 'spending' | 'budgets' | 'net_worth' | 'transactions' | 'credit_score'>('dashboard');

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Record<string, number>>({
    "Earnings": 6041,
    "Spending": 4914,
    "Bills & Utilities": 221
  });

  const [dataLoading, setDataLoading] = useState(false);
  const [isBankDialogOpen, setIsBankDialogOpen] = useState(false);
  const [isGetAppOpen, setIsGetAppOpen] = useState(false);
  const [isSuggesterOpen, setIsSuggesterOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [plaidStatus, setPlaidStatus] = useState<{
    configured: boolean, 
    hasClientId: boolean, 
    hasSecret: boolean, 
    env: string,
    warning?: string
  }>({
    configured: false,
    hasClientId: false,
    hasSecret: false,
    env: 'sandbox'
  });

  const [loadingStatus, setLoadingStatus] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loadingPlaid, setLoadingPlaid] = useState(false);
  const [plaidLinkError, setPlaidLinkError] = useState<string | null>(null);

  // Sync Transactions snapshot with Firestore
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      return;
    }

    setDataLoading(true);
    const q = query(collection(db, 'users', user.uid, 'transactions'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          ...d,
          id: doc.id,
          date: d.date?.toDate ? d.date.toDate() : new Date(d.date)
        };
      }) as Transaction[];
      
      setTransactions(data.sort((a, b) => b.date.getTime() - a.date.getTime()));
      setDataLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/transactions`);
      setDataLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Sync budgets from Firestore or set defaults
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'users', user.uid, 'budgets'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveBudgets: Record<string, number> = {};
      snapshot.docs.forEach(docSnap => {
        liveBudgets[docSnap.id] = docSnap.data().limit;
      });

      setBudgets({
        "Earnings": liveBudgets["Earnings"] || 6041,
        "Spending": liveBudgets["Spending"] || 4914,
        "Bills & Utilities": liveBudgets["Bills & Utilities"] || 221
      });
    });

    return () => unsubscribe();
  }, [user]);

  // Seeding function to populate exact dataset from the user's uploaded image
  const seedDemoData = useCallback(async (userId: string) => {
    try {
      const batch = writeBatch(db);
      
      const demoTx = [
        { id: "tx_seed1", date: new Date(2026, 4, 20), description: "Rouses Markets", amount: 31.82, category: "Spending", type: "expense" },
        { id: "tx_seed2", date: new Date(2026, 4, 20), description: "Anytime Fitness", amount: 29.47, category: "Spending", type: "expense" },
        { id: "tx_seed3", date: new Date(2026, 4, 20), description: "Apex Trader Funding", amount: 24.90, category: "Bills & Utilities", type: "expense" },
        { id: "tx_seed4", date: new Date(2026, 4, 20), description: "Apex Trader Funding", amount: 34.90, category: "Bills & Utilities", type: "expense" },
        { id: "tx_seed5", date: new Date(2026, 4, 19), description: "Apex Trader Funding", amount: 34.90, category: "Bills & Utilities", type: "expense" },
        { id: "tx_seed6", date: new Date(2026, 4, 18), description: "Direct Deposit Salary Paycheck", amount: 9557.00, category: "Earnings", type: "income" },
        { id: "tx_seed7", date: new Date(2026, 4, 15), description: "Other Spending Outflow", amount: 7498.71, category: "Spending", type: "expense" },
        { id: "tx_seed8", date: new Date(2026, 4, 10), description: "Federal Power Utility Grid", amount: 308.30, category: "Bills & Utilities", type: "expense" }
      ];
      
      demoTx.forEach(t => {
        const docRef = doc(db, 'users', userId, 'transactions', t.id);
        batch.set(docRef, {
          id: t.id,
          date: t.date,
          description: t.description,
          amount: t.amount,
          category: t.category,
          type: t.type,
          createdAt: serverTimestamp()
        });
      });

      const demoBudgets = [
        { id: "Earnings", limit: 6041 },
        { id: "Spending", limit: 4914 },
        { id: "Bills & Utilities", limit: 221 }
      ];
      demoBudgets.forEach(b => {
        const docRef = doc(db, 'users', userId, 'budgets', b.id);
        batch.set(docRef, { limit: b.limit, updatedAt: serverTimestamp() });
      });

      await batch.commit();
    } catch (err) {
      console.error("Failed to seed demo data", err);
    }
  }, []);

  // Watch for cold-start (no transactions) and auto-seed immediately
  useEffect(() => {
    if (!user || authLoading || dataLoading) return;

    const checkAndSeed = async () => {
      const snap = await getDocs(query(collection(db, 'users', user.uid, 'transactions')));
      if (snap.empty) {
        console.log("No transactions located, auto-seeding demo image dataset...");
        await seedDemoData(user.uid);
      }
    };
    checkAndSeed();
  }, [user, authLoading, dataLoading, seedDemoData]);

  // Check Plaid parameters
  const checkPlaidStatus = useCallback(() => {
    setLoadingStatus(true);
    fetch("/api/plaid/status")
      .then(res => res.json())
      .then(data => setPlaidStatus(data))
      .finally(() => setLoadingStatus(false));
  }, []);

  useEffect(() => {
    checkPlaidStatus();
  }, [checkPlaidStatus]);

  // Get Link Token
  useEffect(() => {
    if (isBankDialogOpen && plaidStatus.configured && !linkToken) {
      setLoadingPlaid(true);
      setPlaidLinkError(null);
      fetch("/api/plaid/create_link_token", { method: "POST" })
        .then(res => res.json())
        .then(data => {
          if (data.error || data.plaid_error) {
            const pError = data.plaid_error;
            let errorMessage = data.error;
            if (pError) {
              errorMessage = `${pError.error_code}: ${pError.error_message}`;
            }
            setPlaidLinkError(errorMessage);
            return;
          }
          setLinkToken(data.link_token);
        })
        .catch(err => {
          setPlaidLinkError("Failed to reach server");
          console.error(err);
        })
        .finally(() => setLoadingPlaid(false));
    }
  }, [isBankDialogOpen, plaidStatus.configured, linkToken]);

  const saveTransactions = useCallback(async (newTransactions: Transaction[]) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      newTransactions.forEach(t => {
        const docRef = doc(db, 'users', user.uid, 'transactions', t.id);
        batch.set(docRef, {
          ...t,
          createdAt: serverTimestamp()
        });
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/transactions`);
    }
  }, [user]);

  const handleAddManualTransaction = useCallback(async (t: { description: string; amount: number; type: "expense" | "income"; category: string; date: Date }) => {
    if (!user) return;
    try {
      const id = "tx-" + Date.now();
      const docRef = doc(db, 'users', user.uid, 'transactions', id);
      await setDoc(docRef, {
        ...t,
        id,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  const handleSaveBudgets = useCallback(async (newBudgets: Record<string, number>) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      Object.entries(newBudgets).forEach(([key, limit]) => {
        const docRef = doc(db, 'users', user.uid, 'budgets', key);
        batch.set(docRef, { limit, updatedAt: serverTimestamp() });
      });
      await batch.commit();
      setBudgets(newBudgets);
    } catch (err) {
      console.error("Failed to save budgets to Firestore", err);
    }
  }, [user]);

  const clearAllData = useCallback(async () => {
    if (!user) return;
    if (!confirm("Are you sure you want to clear all data? This cannot be undone.")) return;

    try {
      const q = query(collection(db, 'users', user.uid, 'transactions'));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      setTransactions([]);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/transactions`);
    }
  }, [user]);

  const onPlaidSuccess = useCallback(async (public_token: string) => {
    try {
      const res = await fetch("/api/plaid/exchange_public_token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_token }),
      });
      const { access_token, item_id } = await res.json();
      
      if (user) {
        await setDoc(doc(db, 'users', user.uid, 'banks', item_id), {
          itemId: item_id,
          accessToken: access_token,
          createdAt: serverTimestamp()
        });
      }

      const transRes = await fetch("/api/plaid/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token }),
      });
      const transData = await transRes.json();
      
      const mapped = transData.added.map((t: any) => ({
        id: t.transaction_id,
        date: new Date(t.date),
        description: t.name,
        amount: Math.abs(t.amount),
        category: t.category?.[0] || "General",
        type: t.amount > 0 ? "expense" : "income"
      }));
      
      await saveTransactions(mapped);
      setIsBankDialogOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to sync transactions");
    }
  }, [user, saveTransactions]);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
  });

  const summary = useMemo((): BudgetSummary => {
    const expenses = transactions.filter(t => t.type === "expense");
    const income = transactions.filter(t => t.type === "income");

    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);

    const categoryMap = transactions.reduce((acc, t) => {
      if (t.type === "expense") {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
      }
      return acc;
    }, {} as Record<string, number>);

    const categories: BudgetCategory[] = Object.entries(categoryMap).map(([name, spent]) => ({
      name,
      spent: Number(spent),
      budget: budgets[name] || 0,
      color: "hsl(var(--primary))"
    }));

    const monthlyMap = transactions.reduce((acc, t) => {
      const month = t.date.toLocaleString('default', { month: 'short' });
      if (!acc[month]) acc[month] = { income: 0, expenses: 0 };
      if (t.type === "income") acc[month].income += Number(t.amount);
      else acc[month].expenses += Number(t.amount);
      return acc;
    }, {} as Record<string, { income: number; expenses: number }>);

    const monthlyData = Object.entries(monthlyMap).map(([month, data]) => {
      const { income, expenses } = data as { income: number; expenses: number };
      return { month, income, expenses };
    }).sort((a, b) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months.indexOf(a.month) - months.indexOf(b.month);
    });

    return {
      totalIncome,
      totalExpenses,
      netSavings: totalIncome - totalExpenses,
      categories,
      monthlyData
    };
  }, [transactions, budgets]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-slate-800" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-4">
        <Card className="max-w-md w-full rounded-3xl border-none shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-gradient-to-tr from-indigo-600 to-indigo-800 p-10 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full transform translate-x-10 -translate-y-10"></div>
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
              <Sparkles className="w-9 h-9 text-indigo-200 animate-pulse" />
            </div>
            <h1 className="text-3xl font-sans font-black tracking-tight mb-2">Kanso Ledger</h1>
            <p className="text-white/80 italic text-sm font-medium">Organize your financial habits and cashflow limits with serene clarity.</p>
          </div>
          <CardContent className="p-10 space-y-6">
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-sm text-slate-600">Your statements are stored inside your private Firestore vaults.</p>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-sm text-slate-600">Sync checking accounts, calculate monthly targets, and review trends.</p>
              </div>
            </div>
            
            <Button 
              onClick={signInWithGoogle}
              className="w-full py-7 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold text-lg shadow-xl shadow-slate-200 flex items-center justify-center gap-2"
            >
              Sign In with Google
              <ChevronRight className="w-5 h-5" />
            </Button>
            
            <p className="text-[10px] text-center text-slate-400 uppercase tracking-widest font-bold">
              Protected by Firebase Auth
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex flex-col text-slate-800 font-sans">
      
      {/* Mobile Sticky Top Navigation Bar */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <button 
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1.5 -ml-1 text-slate-500 hover:text-slate-950 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-8 bg-gradient-to-tr from-emerald-600 to-teal-400 rounded-xl flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <span className="text-lg font-sans font-black tracking-tight text-slate-900">Kanso</span>
            <span className="text-lg font-sans font-semibold text-emerald-600 tracking-tight">Ledger</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <img 
            src={user.photoURL || ""} 
            alt={user.displayName || ""} 
            referrerPolicy="no-referrer" 
            className="w-7 h-7 rounded-full border border-slate-150 flex-shrink-0 cursor-pointer animate-in fade-in" 
            onClick={() => setIsMobileMenuOpen(true)}
          />
        </div>
      </header>

      {/* Slide-over Mobile Side Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          {/* Backdrop Blur overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Drawer Content */}
          <div 
            className="relative flex flex-col w-full max-w-[280px] bg-white h-full p-6 shadow-2xl animate-in slide-in-from-left duration-300"
          >
            {/* Drawer Close trigger & title */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-tr from-emerald-600 to-teal-400 rounded-xl flex items-center justify-center text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-md font-sans font-black tracking-tight text-slate-900">Kanso</span>
                <span className="text-md font-sans font-semibold text-emerald-600 tracking-tight">Ledger</span>
              </div>
              <button 
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation links inside drawer */}
            <nav className="space-y-1 flex-1 overflow-y-auto">
              <NavItem 
                icon={<LayoutDashboard className="w-4 h-4" />} 
                label="Dashboard" 
                active={activeSection === "dashboard"} 
                onClick={() => {
                  setActiveSection("dashboard");
                  setIsMobileMenuOpen(false);
                }}
              />
              <NavItem 
                icon={<Calendar className="w-4 h-4" />} 
                label="Recurring" 
                active={activeSection === "recurring"} 
                onClick={() => {
                  setActiveSection("recurring");
                  setIsMobileMenuOpen(false);
                }}
              />
              <NavItem 
                icon={<TrendingDown className="w-4 h-4" />} 
                label="Spending" 
                active={activeSection === "spending"} 
                onClick={() => {
                  setActiveSection("spending");
                  setIsMobileMenuOpen(false);
                }}
              />
              <NavItem 
                icon={<PieChartIcon className="w-4 h-4" />} 
                label="Budgets" 
                active={activeSection === "budgets"} 
                onClick={() => {
                  setActiveSection("budgets");
                  setIsMobileMenuOpen(false);
                }}
              />
              <NavItem 
                icon={<TrendingUp className="w-4 h-4" />} 
                label="Net Worth" 
                active={activeSection === "net_worth"} 
                onClick={() => {
                  setActiveSection("net_worth");
                  setIsMobileMenuOpen(false);
                }}
              />
              <NavItem 
                icon={<Layers className="w-4 h-4" />} 
                label="Transactions" 
                active={activeSection === "transactions"} 
                onClick={() => {
                  setActiveSection("transactions");
                  setIsMobileMenuOpen(false);
                }}
              />
              <NavItem 
                icon={<Activity className="w-4 h-4" />} 
                label="Credit Score" 
                active={activeSection === "credit_score"} 
                onClick={() => {
                  setActiveSection("credit_score");
                  setIsMobileMenuOpen(false);
                }}
              />
            </nav>

            {/* Bottom utilities inside mobile drawer */}
            <div className="pt-6 border-t border-slate-100 space-y-3">
              <div className="space-y-1">
                <button 
                  type="button"
                  onClick={() => {
                    setIsGetAppOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between text-left px-4 py-2 text-slate-500 hover:text-slate-900 text-xs font-bold hover:bg-slate-50 rounded-xl transition-all"
                >
                  <span className="flex items-center gap-2.5">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    Get Mobile App
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 animate-pulse" />
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setIsSuggesterOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between text-left px-4 py-2 text-slate-500 hover:text-slate-900 text-xs font-bold hover:bg-slate-50 rounded-xl transition-all"
                >
                  <span className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Suggest feature
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setIsChatOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between text-left px-4 py-2 text-slate-500 hover:text-slate-900 text-xs font-bold hover:bg-slate-50 rounded-xl transition-all"
                >
                  <span className="flex items-center gap-2.5">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    Chat with us
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* User profile card inside mobile drawer */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img 
                    src={user.photoURL || ""} 
                    alt={user.displayName || ""} 
                    referrerPolicy="no-referrer" 
                    className="w-7 h-7 rounded-full border border-white flex-shrink-0" 
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-slate-900 truncate">{user.displayName}</p>
                    <p className="text-[9px] text-slate-400 truncate mt-0.5">{user.email}</p>
                  </div>
                </div>
                <button onClick={logout} className="text-slate-400 hover:text-rose-500 transition-all p-1 hover:bg-white rounded-lg">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Brand & Floating Card Deck for Desktop Workspace */}
      <header className="hidden md:flex items-center justify-between px-8 py-5 bg-white/70 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200/50 shadow-sm">
        <div className="flex items-center gap-10">
          {/* Elegant Kanso Emblem Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100 text-white font-semibold transform rotate-3 hover:rotate-12 transition-transform duration-300">
              <Sparkles className="w-4.5 h-4.5 text-white animate-pulse" />
            </div>
            <div>
              <span className="text-lg font-sans font-black tracking-tight text-slate-950">Kanso</span>
              <span className="text-lg font-sans font-semibold text-emerald-600 tracking-tight ml-0.5">Ledger</span>
            </div>
          </div>

          {/* Centered Pill/Tab Bar */}
          <nav className="flex items-center gap-1 bg-slate-100/70 p-1 rounded-2xl border border-slate-150/40">
            <NavTab 
              icon={<LayoutDashboard className="w-3.5 h-3.5" />} 
              label="Dashboard" 
              active={activeSection === "dashboard"} 
              onClick={() => setActiveSection("dashboard")}
            />
            <NavTab 
              icon={<Calendar className="w-3.5 h-3.5" />} 
              label="Recurring" 
              active={activeSection === "recurring"} 
              onClick={() => setActiveSection("recurring")}
            />
            <NavTab 
              icon={<TrendingDown className="w-3.5 h-3.5" />} 
              label="Spending" 
              active={activeSection === "spending"} 
              onClick={() => setActiveSection("spending")}
            />
            <NavTab 
              icon={<PieChartIcon className="w-3.5 h-3.5" />} 
              label="Budgets" 
              active={activeSection === "budgets"} 
              onClick={() => setActiveSection("budgets")}
            />
            <NavTab 
              icon={<TrendingUp className="w-3.5 h-3.5" />} 
              label="Net Worth" 
              active={activeSection === "net_worth"} 
              onClick={() => setActiveSection("net_worth")}
            />
            <NavTab 
              icon={<Layers className="w-3.5 h-3.5" />} 
              label="Transactions" 
              active={activeSection === "transactions"} 
              onClick={() => setActiveSection("transactions")}
            />
            <NavTab 
              icon={<Activity className="w-3.5 h-3.5" />} 
              label="Credit" 
              active={activeSection === "credit_score"} 
              onClick={() => setActiveSection("credit_score")}
            />
          </nav>
        </div>

        {/* Quick Utilities Hub */}
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsChatOpen(true)}
            className="flex items-center gap-1.5 rounded-xl hover:bg-emerald-50 text-slate-650 hover:text-emerald-800 font-bold text-xs px-3"
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            AI Advisor
          </Button>

          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsSuggesterOpen(true)}
            className="flex items-center gap-1.5 rounded-xl hover:bg-slate-50 text-slate-650 hover:text-slate-900 font-bold text-xs px-3"
          >
            <Sparkle className="w-4 h-4 text-yellow-500 animate-spin-slow" />
            Suggest
          </Button>

          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsGetAppOpen(true)}
            className="flex items-center gap-1.5 rounded-xl hover:bg-slate-50 text-slate-650 hover:text-slate-900 font-bold text-xs px-3"
          >
            <Smartphone className="w-4 h-4 text-indigo-500" />
            Get App
          </Button>

          <div className="h-4 w-[1px] bg-slate-200 mx-1"></div>

          {/* User Profile avatar component */}
          <div className="flex items-center gap-3.5 pl-1.5">
            <img 
              src={user.photoURL || ""} 
              alt={user.displayName || ""} 
              referrerPolicy="no-referrer" 
              className="w-8 h-8 rounded-full border border-slate-200 cursor-pointer hover:border-emerald-500 transition-all duration-300" 
              title={`${user.displayName} (${user.email})`}
            />
            <button 
              onClick={logout} 
              className="text-slate-400 hover:text-rose-500 p-1.5 hover:bg-slate-100/50 rounded-xl transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-6 md:p-10 relative">
        
        {/* Universal Space Header Banner */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-6 border-b border-slate-200/50 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-widest text-emerald-700 bg-emerald-50/70 border border-emerald-100 rounded-lg px-2.5 py-1 uppercase">
                Kanso Dashboard
              </span>
              <span className="text-[10px] text-slate-400 font-mono font-medium">Safe Connection Activated</span>
            </div>
            <h1 className="text-3xl font-serif font-black text-slate-950 capitalize tracking-tight mt-1.5 duration-300">
              {activeSection.replace("_", " ")}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Dialog open={isBankDialogOpen} onOpenChange={setIsBankDialogOpen}>
              <DialogTrigger 
                render={
                  <Button variant="outline" size="sm" className="flex items-center gap-2 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 font-bold px-4 py-5 font-sans shadow-none text-slate-600 hover:text-slate-950 transition-all">
                    <Landmark className="w-4 h-4 text-emerald-605" />
                    Link Institution
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-md rounded-3xl border-none shadow-2xl p-8 bg-white">
                <DialogHeader>
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                    <Landmark className="w-6 h-6" />
                  </div>
                  <DialogTitle className="font-serif text-3xl mb-2 text-slate-900 font-bold">Connect your bank</DialogTitle>
                  <DialogDescription className="text-slate-500 text-base leading-relaxed">
                    Automate your tracking by securely linking your accounts. We use Plaid to synchronize your data.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 pt-4">
                  {!plaidStatus.configured ? (
                    <div className="p-5 bg-orange-50/50 border border-orange-100 rounded-2xl flex gap-4 items-start">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Settings className="w-5 h-5 text-orange-500" />
                      </div>
                      <div className="text-sm text-slate-800 leading-relaxed">
                        <p className="font-bold mb-1 col-span-2">Plaid setup required</p>
                        <p className="text-slate-600 mb-3 text-xs">
                          {!plaidStatus.hasClientId && <span>Missing <b>PLAID_CLIENT_ID</b>. </span>}
                          {!plaidStatus.hasSecret && <span>Missing <b>PLAID_SECRET</b>. </span>}
                          Please configure these credentials inside the <b>Secrets</b> menu.
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-xs rounded-lg border-orange-200 hover:bg-white font-bold"
                          onClick={checkPlaidStatus}
                          disabled={loadingStatus}
                        >
                          {loadingStatus ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <TrendingUp className="w-3 h-3 mr-2" />}
                          Check Again
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-4 items-start">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="text-sm text-emerald-900 leading-relaxed">
                        <p className="font-bold mb-1">Plaid Connected ({plaidStatus.env})</p>
                        <p className="text-emerald-700/80 text-xs">Your API keys are active. You're ready to link your account!</p>
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    className={cn(
                      "w-full rounded-2xl py-8 text-lg font-semibold shadow-xl transition-all active:scale-[0.98]",
                      plaidLinkError ? "bg-rose-500 hover:bg-rose-600 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100"
                    )}
                    disabled={!plaidStatus.configured || !ready || loadingPlaid}
                    onClick={() => open()}
                  >
                    {loadingPlaid ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : plaidLinkError ? (
                      <span className="text-xs">Error: {plaidLinkError.substring(0, 40)}...</span>
                    ) : (
                      <>Connect via Plaid</>
                    )}
                  </Button>
                  <p className="text-[10px] text-center text-slate-400 uppercase tracking-widest font-bold">
                    Encrypted and Secure &bull; Powered by Plaid
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* Sync Loader spinner */}
        {dataLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-slate-800 opacity-40" />
            <p className="text-slate-400 text-xs italic">Syncing with your cloud vault...</p>
          </div>
        ) : (
          
          /* Render Active Navigation section with smooth fades */
          <div className="transition-all duration-300">
            {activeSection === "dashboard" && (
              <DashboardView 
                transactions={transactions} 
                budgets={budgets}
                userDisplayName={user.displayName}
                onNavigate={(dest) => setActiveSection(dest)}
                onLinkAccount={() => setIsBankDialogOpen(true)}
              />
            )}

            {activeSection === "recurring" && (
              <RecurringView 
                onAddTransaction={handleAddManualTransaction}
              />
            )}

            {activeSection === "spending" && (
              <SpendingView 
                transactions={transactions}
              />
            )}

            {activeSection === "budgets" && (
              <BudgetsView 
                budgets={budgets} 
                transactions={transactions} 
                onSaveBudgets={handleSaveBudgets}
              />
            )}

            {activeSection === "net_worth" && (
              <NetWorthView 
                transactions={transactions} 
                monthlyData={summary.monthlyData}
              />
            )}

            {activeSection === "transactions" && (
              <div className="space-y-8">
                <Card className="border border-slate-100 shadow-sm rounded-3xl p-6 bg-white flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">Transaction Database</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Drag-and-drop CSV exports or input single operations manually.</p>
                  </div>
                  <div>
                    <FileUpload onDataParsed={saveTransactions} />
                  </div>
                </Card>

                <Card className="border border-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white">
                  <CardHeader className="bg-white flex flex-row items-center justify-between">
                    <CardTitle className="text-base text-slate-800 font-sans font-bold">Ledger Feed</CardTitle>
                    <Button 
                      variant="ghost" 
                      onClick={clearAllData}
                      className="text-xs font-bold text-rose-500 hover:bg-rose-50 h-9 rounded-xl"
                    >
                      Clear Database
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0 bg-white">
                    <TransactionTable transactions={transactions} />
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === "credit_score" && (
              <CreditScoreView />
            )}
          </div>
        )}

        {/* Drawer alerts / Dialogs */}
        <FeatureSuggester 
          userId={user.uid} 
          isOpen={isSuggesterOpen} 
          onClose={() => setIsSuggesterOpen(false)} 
        />

        <ChatAdvisor 
          transactions={transactions} 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
        />

        {/* Get App information dialog */}
        <Dialog open={isGetAppOpen} onOpenChange={setIsGetAppOpen}>
          <DialogContent className="sm:max-w-md rounded-3xl overflow-hidden shadow-2xl p-8 border-none bg-white">
            <DialogHeader>
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6 animate-bounce" />
              </div>
              <DialogTitle className="font-sans text-3xl mb-1.5 text-slate-900 font-bold tracking-tight">Kanso Ledger Sync</DialogTitle>
              <DialogDescription className="text-slate-500 text-sm leading-relaxed">
                Unlock instant sync constraints, on-the-go notifications, and biometric verification layers by downloading our responsive mobile app.
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 flex flex-col items-center justify-center gap-4 bg-slate-50 border border-slate-150 rounded-2xl mt-4">
              {/* Decorative QR area */}
              <div className="w-32 h-32 bg-white/90 rounded-xl border border-dashed border-slate-300 flex items-center justify-center p-3 relative shadow-inner">
                <div className="w-full h-full bg-slate-900 rounded-md p-1.5 text-white flex flex-wrap gap-1 relative overflow-hidden">
                  {/* Pseudo QR styling */}
                  <div className="w-8 h-8 bg-black border-2 border-white rounded-xs"></div>
                  <div className="w-8 h-8 bg-slate-300 rounded-xs"></div>
                  <div className="w-8 h-8 bg-slate-600 rounded-xs"></div>
                  <div className="w-8 h-8 bg-slate-400 rounded-xs font-mono text-[6px] text-center pt-2">ZB</div>
                  <div className="absolute inset-4 border border-indigo-400 rounded animate-ping duration-1000"></div>
                </div>
              </div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Scan code with camera</p>
            </div>

            <DialogFooter className="pt-4 flex sm:justify-center">
              <Button onClick={() => setIsGetAppOpen(false)} className="rounded-xl w-full sm:w-28 bg-slate-900 border font-bold">Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all duration-300",
        active 
          ? "bg-slate-900 text-white shadow-lg shadow-slate-200" 
          : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <span className={cn(active ? "text-white animate-pulse" : "text-slate-400 group-hover:text-slate-900")}>
        {icon}
      </span>
      {label}
    </button>
  );
}

function NavTab({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-tight transition-all duration-200 cursor-pointer select-none",
        active 
          ? "bg-white text-emerald-800 shadow-sm border border-slate-200/40" 
          : "text-slate-500 hover:text-slate-950 hover:bg-white/40"
      )}
    >
      <span className={cn(active ? "text-emerald-600 animate-pulse" : "text-slate-400 group-hover:text-slate-600")}>
        {icon}
      </span>
      {label}
    </button>
  );
}

