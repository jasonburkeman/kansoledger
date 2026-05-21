import React, { useState, useEffect } from "react";
import { Sparkles, MessageSquare, ClipboardList, Check, Loader2, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { db } from "../lib/firebase";
import { collection, addDoc, query, onSnapshot, serverTimestamp } from "firebase/firestore";

interface FeatureSuggesterProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Suggestion {
  id: string;
  text: string;
  status: string;
  createdAt: any;
}

export const FeatureSuggester: React.FC<FeatureSuggesterProps> = ({ userId, isOpen, onClose }) => {
  const [suggestionText, setSuggestionText] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Sync suggestion logs from Firestore
  useEffect(() => {
    if (!userId || !isOpen) return;

    const q = query(collection(db, "users", userId, "suggestions"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Suggestion[];
      setSuggestions(list.sort((a,b) => b.createdAt?.seconds - a.createdAt?.seconds));
    });

    return () => unsubscribe();
  }, [userId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestionText.trim() || !userId) return;

    setLoading(true);
    setSuccess(false);

    try {
      await addDoc(collection(db, "users", userId, "suggestions"), {
        text: suggestionText,
        status: "Under Review",
        createdAt: serverTimestamp()
      });
      setSuggestionText("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Suggestion error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl p-8 border border-slate-100/50 flex flex-col justify-between max-h-[85vh]">
        
        <div>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-sans font-extrabold text-slate-800">Suggest a feature</h2>
            </div>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-slate-600 font-bold text-sm w-7 h-7 hover:bg-slate-50 rounded-full flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed mb-6">
            We build with active intention! What capabilities would expand your Kanso Ledger journey? Type them below to register with our product team.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <textarea
                value={suggestionText}
                onChange={e => setSuggestionText(e.target.value)}
                placeholder="e.g., I would love a breakdown that tracks grocery inflation over six months..."
                rows={3}
                className="w-full text-slate-800 text-sm p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-100 placeholder-slate-400 font-medium"
                required
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-11 bg-slate-900 hover:bg-black text-white font-semibold rounded-xl flex items-center justify-center gap-2 text-xs"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : success ? (
                <span className="flex items-center gap-1.5 font-bold">
                  <Check className="w-4 h-4 text-emerald-400" />
                  Registered successfully!
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  Send Proposal
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>
        </div>

        {/* Suggestion history logs listing */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex-1 overflow-auto max-h-[200px]">
          <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-3 flex items-center gap-1">
            <ClipboardList className="w-3.5 h-3.5" />
            Your Suggestion Logs
          </h4>

          {suggestions.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic">No previous suggestions logged.</p>
          ) : (
            <div className="space-y-3">
              {suggestions.map(s => (
                <div key={s.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[12px] flex items-start justify-between gap-4">
                  <p className="text-slate-600 font-medium break-words max-w-[70%]">{s.text}</p>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border px-1.5 py-0.5 rounded-full flex-shrink-0">
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
