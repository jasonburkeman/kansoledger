import React, { useState, useMemo } from "react";
import { 
  ShieldCheck, 
  TrendingUp, 
  HelpCircle, 
  Sliders, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  Sparkles,
  Percent
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Slider } from "./ui/slider";
import { Button } from "./ui/button";

export const CreditScoreView: React.FC = () => {
  // Simulator state offsets
  const [debtRepayment, setDebtRepayment] = useState<number>(0); // 0 to 10,000 paid off
  const [missedPayments, setMissedPayments] = useState<number>(0); // 0 to 3 missed
  const [newCreditQueries, setNewCreditQueries] = useState<number>(0); // 0 to 5 queries

  const baseScore = 748;

  const currentScore = useMemo(() => {
    // Math model to adjust credit score
    let score = baseScore;

    // Debt payoff raises score
    score += Math.round((debtRepayment / 10000) * 42);

    // Missed payments penalizes score heavily
    score -= missedPayments * 65;

    // New inquiries penalize slightly
    score -= newCreditQueries * 4;

    // Constrain to standard credit score limits (300 to 850)
    return Math.max(300, Math.min(850, score));
  }, [debtRepayment, missedPayments, newCreditQueries]);

  const scoreRating = useMemo(() => {
    if (currentScore >= 750) return { label: "Excellent", color: "text-emerald-500", stroke: "#10b981" };
    if (currentScore >= 700) return { label: "Good", color: "text-indigo-500", stroke: "#6366f1" };
    if (currentScore >= 650) return { label: "Fair", color: "text-yellow-500", stroke: "#eab308" };
    return { label: "Poor", color: "text-rose-500", stroke: "#f43f5e" };
  }, [currentScore]);

  // Translate credit score to SVG dial needle angle
  // 300 to 850 converts to angle range -90deg to +90deg (180 deg sweep)
  const dialRotationAngle = useMemo(() => {
    const minS = 300;
    const maxS = 850;
    const percentage = (currentScore - minS) / (maxS - minS);
    return -90 + percentage * 180;
  }, [currentScore]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-sans font-semibold tracking-tight text-slate-900">Credit Monitoring</h1>
        <p className="text-slate-400 text-sm mt-0.5 font-medium">Verify structural variables and simulate prospective score modifications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Arc Dial Card (takes 2 columns) */}
        <div className="lg:col-span-2">
          <Card className="border border-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white h-full flex flex-col justify-between p-6">
            <div className="text-center pb-2">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">TransUnion Equifax</span>
              <h3 className="font-sans font-bold text-slate-800 text-lg mt-0.5">VantageScore 3.0</h3>
            </div>

            {/* Circular dial container */}
            <div className="relative flex items-center justify-center h-48 mt-4">
              <svg width="220" height="150" className="overflow-visible">
                {/* Background arc track */}
                <path 
                  d="M 20,130 A 90,90 0 0,1 200,130" 
                  fill="none" 
                  stroke="#f1f5f9" 
                  strokeWidth="14" 
                  strokeLinecap="round" 
                />
                
                {/* Foreground active colored arc track */}
                <path 
                  d="M 20,130 A 90,90 0 0,1 200,130" 
                  fill="none" 
                  stroke={scoreRating.stroke}
                  strokeWidth="14" 
                  strokeLinecap="round" 
                  strokeDasharray="282"
                  strokeDashoffset={282 - (282 * ((currentScore - 300) / 550))}
                  className="transition-all duration-700 ease-out"
                />

                {/* Needle pointer */}
                <g 
                  transform={`translate(110, 130) rotate(${dialRotationAngle})`}
                  className="transition-transform duration-700 ease-out"
                >
                  <polygon points="-5,0 0,-92 5,0" fill="#334155" />
                  <circle cx="0" cy="0" r="10" fill="#1e293b" />
                </g>
              </svg>

              {/* Central text display */}
              <div className="absolute bottom-4 flex flex-col items-center">
                <span className="text-5xl font-sans font-black tracking-tight text-slate-800">{currentScore}</span>
                <span className={`text-[13px] font-extrabold uppercase mt-1 tracking-widest ${scoreRating.color}`}>
                  {scoreRating.label}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[11px] text-slate-500 font-bold mt-4">
              <span>Next estimated update:</span>
              <span className="text-slate-800 font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                June 19, 2026
              </span>
            </div>
          </Card>
        </div>

        {/* Simulator sliders (takes 3 columns) */}
        <div className="lg:col-span-3">
          <Card className="border border-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white h-full flex flex-col justify-between p-6">
            <div className="pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Sliders className="w-4 h-4" />
                </div>
                <h3 className="font-sans font-extrabold text-slate-800 text-lg">Interactive Score Simulator</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">Slide actions below to predict instant impact variations on your score rating.</p>
            </div>

            <div className="space-y-6 flex-1 py-4 border-t border-slate-100">
              
              {/* Slider 1 */}
              <div className="space-y-2.5">
                <div className="flex justify-between text-xs font-bold uppercase text-slate-400">
                  <span>Pay off Credit Card Debt</span>
                  <span className="text-indigo-600 font-extrabold">${debtRepayment.toLocaleString()}</span>
                </div>
                <Slider 
                  value={[debtRepayment]} 
                  onValueChange={(val) => setDebtRepayment(val[0])}
                  max={10000} 
                  step={500}
                />
                <span className="text-[10px] italic text-slate-400 block">Reduces revolving credit utilization ratios instantly.</span>
              </div>

              {/* Slider 2 */}
              <div className="space-y-2.5">
                <div className="flex justify-between text-xs font-bold uppercase text-slate-400">
                  <span>Missed Monthly Charge Agreements</span>
                  <span className="text-rose-500 font-extrabold">{missedPayments} times</span>
                </div>
                <Slider 
                  value={[missedPayments]} 
                  onValueChange={(val) => setMissedPayments(val[0])}
                  max={3} 
                  step={1}
                />
                <span className="text-[10px] italic text-slate-400 block">Substantially degrades account history integrity metrics.</span>
              </div>

              {/* Slider 3 */}
              <div className="space-y-2.5">
                <div className="flex justify-between text-xs font-bold uppercase text-slate-400">
                  <span>New Credit Inquiries / Applications</span>
                  <span className="text-slate-700 font-extrabold">{newCreditQueries} events</span>
                </div>
                <Slider 
                  value={[newCreditQueries]} 
                  onValueChange={(val) => setNewCreditQueries(val[0])}
                  max={5} 
                  step={1}
                />
                <span className="text-[10px] italic text-slate-400 block">Hard credit score pulls lower index rankings temporarily.</span>
              </div>

            </div>

            {/* Simulated versus current comparison box */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between text-xs mt-4">
              <span className="font-bold text-slate-500">Predicted Change Impact:</span>
              <div className="flex items-center gap-2 font-black text-sm">
                {currentScore === baseScore ? (
                  <span className="text-slate-500">0pts (Stable)</span>
                ) : currentScore > baseScore ? (
                  <span className="text-emerald-500">+{currentScore - baseScore} points (Growth)</span>
                ) : (
                  <span className="text-rose-500">{currentScore - baseScore} points (Loss)</span>
                )}
              </div>
            </div>

          </Card>
        </div>

      </div>

      {/* Credit Analyzers metrics list */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm flex items-start gap-4">
          <div className="p-2.5 bg-emerald-50 text-emerald-500 rounded-2xl flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-[14px]">Payment Integrity</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">High Impact Factor</p>
            <p className="text-[12px] text-slate-500 leading-relaxed mt-1.5">
              Excellent payment history tracking over past seasons. On-time deposits represent 35% of overall score grading.
            </p>
          </div>
        </Card>

        <Card className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm flex items-start gap-4">
          <div className="p-2.5 bg-emerald-50 text-emerald-500 rounded-2xl flex-shrink-0">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-[14px]">Credit Utilization</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">High Impact Factor</p>
            <p className="text-[12px] text-slate-500 leading-relaxed mt-1.5">
              Utilized limits reside under 6%, which displays magnificent cash reserve containment habits.
            </p>
          </div>
        </Card>

        <Card className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm flex items-start gap-4">
          <div className="p-2.5 bg-yellow-50 text-yellow-500 rounded-2xl flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-[14px]">Account Age depth</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Medium Impact Factor</p>
            <p className="text-[12px] text-slate-500 leading-relaxed mt-1.5">
              Average accounts age sits around 4.2 years. Gradually establishing deeper depth will bolster reliability indices.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
