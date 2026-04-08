import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calculator, IndianRupee, Calendar, Percent } from 'lucide-react';

export default function EMICalculator({ price }) {
  const [loanAmount, setLoanAmount] = useState(price ? Math.round(price * 0.8) : 10000000);
  const [rate, setRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);

  const emi = useMemo(() => {
    const P = loanAmount;
    const r = rate / 12 / 100;
    const n = tenure * 12;
    if (r === 0) return P / n;
    const emiVal = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Math.round(emiVal);
  }, [loanAmount, rate, tenure]);

  const totalPayment = emi * tenure * 12;
  const totalInterest = totalPayment - loanAmount;

  const formatCurrency = (v) => {
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)} L`;
    return `₹${v?.toLocaleString('en-IN')}`;
  };

  const principalPercent = Math.round((loanAmount / totalPayment) * 100);
  const interestPercent = 100 - principalPercent;

  return (
    <div className="glass-card p-6 border-indigo-500/10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
          <Calculator size={20} className="text-emerald-400" />
        </div>
        <h4 className="font-semibold text-base">EMI Calculator</h4>
      </div>

      {/* Sliders */}
      <div className="space-y-6 mb-6">
        {/* Loan Amount */}
        <div>
          <div className="flex justify-between text-sm mb-2.5">
            <span className="text-on-surface-variant flex items-center gap-1.5"><IndianRupee size={14} /> Loan Amount</span>
            <span className="font-semibold text-on-surface">{formatCurrency(loanAmount)}</span>
          </div>
          <input
            type="range"
            min={500000}
            max={50000000}
            step={100000}
            value={loanAmount}
            onChange={(e) => setLoanAmount(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #6366f1 ${(loanAmount / 50000000) * 100}%, rgba(70, 69, 84, 0.4) ${(loanAmount / 50000000) * 100}%)`,
            }}
          />
        </div>

        {/* Interest Rate */}
        <div>
          <div className="flex justify-between text-sm mb-2.5">
            <span className="text-on-surface-variant flex items-center gap-1.5"><Percent size={14} /> Interest Rate</span>
            <span className="font-semibold text-on-surface">{rate}%</span>
          </div>
          <input
            type="range"
            min={5}
            max={15}
            step={0.1}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #10b981 ${((rate - 5) / 10) * 100}%, rgba(70, 69, 84, 0.4) ${((rate - 5) / 10) * 100}%)`,
            }}
          />
        </div>

        {/* Tenure */}
        <div>
          <div className="flex justify-between text-sm mb-2.5">
            <span className="text-on-surface-variant flex items-center gap-1.5"><Calendar size={14} /> Tenure</span>
            <span className="font-semibold text-on-surface">{tenure} years</span>
          </div>
          <input
            type="range"
            min={1}
            max={30}
            step={1}
            value={tenure}
            onChange={(e) => setTenure(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #818cf8 ${(tenure / 30) * 100}%, rgba(70, 69, 84, 0.4) ${(tenure / 30) * 100}%)`,
            }}
          />
        </div>
      </div>

      {/* EMI Result */}
      <motion.div
        key={emi}
        initial={{ scale: 0.95, opacity: 0.5 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center py-5 rounded-2xl bg-gradient-to-br from-indigo-500/15 to-emerald-500/10 border border-indigo-500/20 mb-5 shadow-inner"
      >
        <span className="text-sm text-on-surface-variant block mb-1">Monthly EMI</span>
        <span className="text-3xl font-bold text-on-surface tracking-tight">{formatCurrency(emi)}</span>
        <span className="text-sm text-on-surface-variant block mt-1">/ month</span>
      </motion.div>

      {/* Breakdown */}
      <div className="flex gap-4">
        <div className="flex-1 p-4 rounded-xl bg-surface-container-highest/60 text-center border border-white/5">
          <span className="text-xs text-on-surface-variant block mb-1">Principal</span>
          <span className="text-sm font-bold text-indigo-400">{formatCurrency(loanAmount)}</span>
          <div className="mt-2 h-1.5 rounded-full bg-surface-container overflow-hidden">
            <div className="h-full rounded-full bg-indigo-500" style={{ width: `${principalPercent}%` }} />
          </div>
        </div>
        <div className="flex-1 p-4 rounded-xl bg-surface-container-highest/60 text-center border border-white/5">
          <span className="text-xs text-on-surface-variant block mb-1">Interest</span>
          <span className="text-sm font-bold text-emerald-400">{formatCurrency(totalInterest)}</span>
          <div className="mt-2 h-1.5 rounded-full bg-surface-container overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${interestPercent}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
