export interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  category: string;
  type: "income" | "expense";
}

export interface BudgetCategory {
  name: string;
  budget: number;
  spent: number;
  color: string;
}

export interface BudgetSummary {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  categories: BudgetCategory[];
  monthlyData: { month: string; income: number; expenses: number }[];
}
