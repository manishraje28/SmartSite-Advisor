import React, { useState } from 'react';
import { Hammer, RefreshCw, ArrowRight } from 'lucide-react';
import { agentAPI } from '../../services/api';

export default function ConstructorUpgradeWidget({ property }) {
  const [loading, setLoading] = useState(false);
  const [upgradePlan, setUpgradePlan] = useState(null);

  const fetchUpgradePlan = async () => {
    if (!property) return;
    setLoading(true);
    try {
      const response = await agentAPI.evaluateUpgrade({ property });
      if (response.data?.success) {
        setUpgradePlan(response.data.data);
      }
    } catch (err) {
      console.error("Upgrade plan error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-ink-800">
        <div className="flex items-start gap-3">
          <Hammer size={20} className="text-ink-300 mt-1 flex-shrink-0" />
          <div>
            <h2 className="text-lg font-bold text-white">Upgrade plan</h2>
            <p className="text-sm text-ink-200">Improvements that could raise this listing's value, with cost and return.</p>
          </div>
        </div>

        <button
          onClick={fetchUpgradePlan}
          disabled={loading}
          className="btn-primary text-sm gap-2 flex-shrink-0"
        >
          {loading && <RefreshCw size={14} className="animate-spin" />}
          <span>Get upgrade plan</span>
        </button>
      </div>

      {!upgradePlan && !loading && (
        <p className="py-6 text-sm text-ink-200">
          Select "Get upgrade plan" to review this listing's features and see which improvements give the best return.
        </p>
      )}

      {loading && (
        <div className="py-10 flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-ink-700 border-t-white rounded-full animate-spin mb-3" />
          <p className="text-sm text-ink-200">Reviewing this listing for upgrades that add value…</p>
        </div>
      )}

      {upgradePlan && !loading && (
        <div className="mt-5 space-y-5">
          {/* Summary */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-ink-800">
            <div>
              <div className="text-sm text-ink-200">Possible price increase</div>
              <div className="text-2xl font-bold text-white tabular">{upgradePlan.estimatedPriceUplift}</div>
              <p className="text-sm text-ink-200 mt-1">{upgradePlan.sellerSummary}</p>
            </div>

            <div className="flex items-center gap-4 flex-shrink-0">
              <div>
                <div className="text-xs text-ink-300">Current score</div>
                <div className="text-xl font-bold text-ink-200 tabular">{upgradePlan.currentPropertyScore}</div>
              </div>
              <ArrowRight size={16} className="text-ink-400" />
              <div>
                <div className="text-xs text-ink-300">After upgrades</div>
                <div className="text-2xl font-bold text-white tabular">{upgradePlan.potentialScoreAfterUpgrades}</div>
              </div>
            </div>
          </div>

          {/* Upgrades */}
          <div className="divide-y divide-ink-800">
            {upgradePlan.priorityUpgrades?.map((item, idx) => (
              <div key={idx} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h3 className="font-semibold text-white text-sm">{item.title}</h3>
                  <span className="text-xs font-semibold text-moss-300 tabular flex-shrink-0">
                    {item.scoreImpact}
                  </span>
                </div>
                <p className="text-sm text-ink-200 mb-2">{item.description}</p>
                <div className="flex items-center gap-5 text-xs text-ink-300 tabular">
                  <span>Est. cost: <span className="text-white font-semibold">{item.costEstimate}</span></span>
                  <span>ROI: <span className="text-white font-semibold">{item.roiMultiplier}</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
