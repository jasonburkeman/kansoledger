import React, { useState } from "react";
import { Sparkles, Loader2, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Transaction } from "../types";
import { motion, AnimatePresence } from "framer-motion";

interface InsightsProps {
  transactions: Transaction[];
}

export const Insights: React.FC<InsightsProps> = ({ transactions }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateInsights = async () => {
    if (transactions.length === 0) return;
    setLoading(true);
    try {
      // Summarize data for Gemini to keep it small
      const summary = transactions.reduce((acc, t) => {
        const key = t.category || "Other";
        if (!acc[key]) acc[key] = 0;
        acc[key] += t.amount;
        return acc;
      }, {} as Record<string, number>);

      const response = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budgetData: summary }),
      });
      const data = await response.json();
      setInsight(data.insight);
    } catch (error) {
      console.error(error);
      setInsight("I couldn't generate insights right now. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-none shadow-xl shadow-natural-sage/5 bg-natural-sage/10 border-natural-sage/20 overflow-hidden rounded-2xl">
      <CardHeader className="pb-3 px-6 pt-6">
        <CardTitle className="text-xl font-serif flex items-center gap-2 text-natural-accent">
          <Sparkles className="w-5 h-5 text-natural-sage" />
          Kanso AI Advisor
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <AnimatePresence mode="wait">
          {!insight ? (
            <motion.div 
              key="cta"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-4"
            >
              <p className="text-sm text-slate-600 leading-relaxed max-w-xl">
                Unlock personalized financial advice based on your spending habits. Our advisor analyzes your patterns to find mindfulness in your money.
              </p>
              <Button 
                onClick={generateInsights} 
                disabled={loading || transactions.length === 0}
                className="bg-natural-accent hover:bg-natural-ink text-white w-fit rounded-xl px-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reflecting...
                  </>
                ) : (
                  <>
                    Generate Insights
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.div>
          ) : (
            <motion.div 
              key="insight"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-natural-ink prose prose-slate max-w-none"
            >
              <div className="whitespace-pre-wrap leading-relaxed italic bg-white/50 p-6 rounded-2xl border border-white/80 shadow-inner">
                {insight}
              </div>
              <Button 
                variant="link" 
                size="sm" 
                onClick={() => setInsight(null)}
                className="p-0 h-auto mt-4 text-natural-sage font-bold uppercase tracking-widest text-[10px]"
              >
                Refresh Analysis
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
