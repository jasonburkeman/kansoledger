import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Bot, User, Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Transaction } from "../types";
import Markdown from "react-markdown";

interface Message {
  sender: "bot" | "user";
  text: string;
}

interface ChatAdvisorProps {
  transactions: Transaction[];
  isOpen: boolean;
  onClose: () => void;
}

export const ChatAdvisor: React.FC<ChatAdvisorProps> = ({ transactions, isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { sender: "bot", text: "Hello! I am your Kanso Ledger AI Advisor. Ask me anything about your cashflow, budgets, subscription strategies, or how you can save more this month!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const containerEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { sender: "user", text: userMessage }]);
    setLoading(true);

    try {
      // Aggregate some context for Gemini
      const basicContext = {
        totalTxCount: transactions.length,
        totalSpent: transactions.filter(t => t.type === "expense").reduce((sum,t) => sum+t.amount, 0),
        totalInflow: transactions.filter(t => t.type === "income").reduce((sum,t) => sum+t.amount, 0),
        categories: transactions.filter(t => t.type === "expense").reduce((acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
          return acc;
        }, {} as Record<string, number>),
        recentTx: transactions.slice(0, 5).map(t => `${t.description}: $${t.amount}`)
      };

      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budgetData: basicContext,
          query: userMessage
        })
      });

      const data = await res.json();
      if (data.insight) {
        setMessages(prev => [...prev, { sender: "bot", text: data.insight }]);
      } else {
        setMessages(prev => [...prev, { sender: "bot", text: "I ran into a slight snag. Could you ask me that again?" }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { sender: "bot", text: "I couldn't reach the advisor server. Please check your network connection." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white shadow-2xl border-l border-slate-200/50 z-50 flex flex-col justify-between">
      
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-sans font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
              Kanso Cashflow Advisor
              <Sparkles className="w-3.5 h-3.5 text-emerald-505" />
            </h3>
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block mt-0.5">Online Advisor</span>
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 font-bold text-sm w-7 h-7 hover:bg-slate-50 rounded-full flex items-center justify-center transition-all"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-6 overflow-auto bg-slate-50/50 space-y-4">
        {messages.map((m, idx) => {
          const isBot = m.sender === "bot";
          return (
            <div key={idx} className={`flex gap-3.5 ${isBot ? "justify-start" : "justify-end"}`}>
              {isBot && (
                <div className="w-7 h-7 bg-slate-100 rounded-full border border-slate-200/50 flex flex-shrink-0 items-center justify-center text-xs">
                  🤖
                </div>
              )}
              <div className={`p-4 rounded-2xl max-w-[80%] shadow-sm text-xs leading-relaxed ${
                isBot 
                  ? "bg-white text-slate-700 rounded-tl-sm border border-slate-100" 
                  : "bg-slate-900 text-white rounded-tr-sm font-semibold"
              }`}>
                {isBot ? (
                  <div className="markdown-body">
                    <Markdown>{m.text}</Markdown>
                  </div>
                ) : (
                  <span>{m.text}</span>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3.5 justify-start">
            <div className="w-7 h-7 bg-slate-100 rounded-full border border-slate-200/50 flex flex-shrink-0 items-center justify-center text-xs animate-spin">
              💫
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-100 text-slate-400 text-xs flex items-center gap-2 shadow-sm italic font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
              Advisor typing...
            </div>
          </div>
        )}
        <div ref={containerEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white flex items-center gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask e.g. 'how are my bills looking against budget?'"
          className="rounded-xl h-11 border-slate-200 font-medium text-slate-800 placeholder-slate-400 flex-1 focus:ring-indigo-100"
          disabled={loading}
        />
        <Button 
          type="submit" 
          disabled={loading || !input.trim()}
          className="h-11 w-11 rounded-xl p-0 bg-slate-900 text-white hover:bg-black flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>

    </div>
  );
};
