import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { agentAPI } from '../../services/api';

export default function NegotiationAdvisorModal({ isOpen, onClose, property }) {
  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState(null);

  const fetchStrategy = async () => {
    if (!property) return;
    setLoading(true);
    try {
      const response = await agentAPI.strategizeNegotiation({
        property,
        buyerBudget: property.price
      });
      if (response.data?.success) {
        setStrategy(response.data.data);
      }
    } catch (err) {
      console.error("Negotiation strategy error:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && property && !strategy) {
      fetchStrategy();
    }
  }, [isOpen, property]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/50">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="bg-white text-ink-900 rounded-lg p-6 max-w-2xl w-full border border-line shadow-lg relative max-h-[90vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 p-1.5 rounded-md text-ink-500 hover:bg-ink-50 hover:text-ink-900 transition-colors"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="mb-5 pr-10">
            <h3 className="text-xl font-bold text-ink-900">Negotiation advice</h3>
            <p className="text-sm text-ink-500 mt-0.5">A suggested counter-offer and how to make it.</p>
          </div>

          {loading && (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-4 border-ink-100 border-t-ink-700 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-ink-500">Working out a target offer and EMI…</p>
            </div>
          )}

          {strategy && !loading && (
            <div className="space-y-6">
              {/* Offer summary */}
              <div className="border border-line rounded-lg p-4 flex items-start justify-between flex-wrap gap-4">
                <div>
                  <div className="text-xs text-ink-500">Suggested counter-offer</div>
                  <div className="text-2xl font-bold text-brick-600 tabular">₹{strategy.recommendedCounterOffer?.toLocaleString('en-IN')}</div>
                  <div className="text-xs text-ink-500 mt-0.5 tabular">List price: ₹{strategy.listPrice?.toLocaleString('en-IN')}</div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-ink-500">Potential savings</div>
                  <div className="text-xl font-bold text-moss-700 tabular">{strategy.estimatedSavingsAmount}</div>
                  <div className="text-xs text-ink-700 mt-0.5 tabular">Estimated EMI: {strategy.estimatedEMI}</div>
                </div>
              </div>

              {/* Tactics list */}
              <div>
                <h4 className="text-sm font-bold text-ink-900 mb-2">How to negotiate, step by step</h4>
                <ol className="list-decimal pl-5 divide-y divide-line border-y border-line">
                  {strategy.negotiationTactics?.map((tactic, idx) => (
                    <li key={idx} className="py-2.5 pl-1 text-sm text-ink-700 leading-relaxed marker:text-ink-500 marker:font-semibold">
                      {tactic}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Closing Advice */}
              <div className="bg-ink-50 p-4 rounded-lg border border-line">
                <div className="text-sm font-bold text-ink-900 mb-1">Closing advice</div>
                <p className="text-sm text-ink-700 leading-relaxed">{strategy.closingAdvice}</p>
              </div>

              <button onClick={onClose} className="btn-primary w-full text-sm">
                Got it
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
