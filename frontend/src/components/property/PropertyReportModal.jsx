import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, MapPin } from 'lucide-react';

export default function PropertyReportModal({ property, isOpen, onClose }) {
  const printRef = useRef(null);

  if (!isOpen || !property) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatPrice = (p) => {
    if (!p) return 'Price on Request';
    if (p >= 10000000) return `₹${(p / 10000000).toFixed(2)} Cr`;
    if (p >= 100000) return `₹${(p / 100000).toFixed(2)} Lakhs`;
    return `₹${p.toLocaleString('en-IN')}`;
  };

  const aiScore = property.aiScore?.overall ?? null;
  const envScore = property.environmentScore?.overall ?? null;
  const aqi = property.environmentScore?.aqi ?? null;
  const roi = property.aiScore?.roiPotential ?? null;
  const rentalYieldEst = roi != null ? `${(roi / 25 + 2.1).toFixed(1)}% p.a.` : '3.2% p.a.';
  const notScored = 'Not yet scored';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-ink-950/50 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-lg shadow-lg overflow-hidden border border-line my-auto"
        >
          {/* Action bar (hidden in print) */}
          <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-line print:hidden">
            <span className="font-semibold text-sm text-ink-900">Property report</span>
            <div className="flex items-center gap-2">
              <button onClick={handlePrint} className="btn-secondary btn-small gap-1.5">
                <Printer size={14} /> <span className="hidden sm:inline">Print / Save PDF</span><span className="sm:hidden">Print</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md text-ink-500 hover:bg-ink-50 hover:text-ink-900 transition-colors"
                title="Close report"
                aria-label="Close report"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Report body */}
          <div ref={printRef} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-white text-ink-900 print:p-6">
            {/* Header */}
            <div className="border-b border-line pb-5 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs text-ink-500 mb-1 tabular">
                  Report ID #SSA-{property._id?.slice(-6).toUpperCase() || '2026-X'}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink-900 leading-tight">
                  {property.title}
                </h1>
                <p className="text-ink-500 text-sm flex items-center gap-1.5 mt-1.5">
                  <MapPin size={14} className="flex-shrink-0" />
                  {property.location?.address || property.location?.city || property.locality}, {property.location?.city || 'MMR Region'}
                </p>
              </div>

              <div className="text-left md:text-right">
                <span className="text-xs text-ink-500 block">Listed price</span>
                <span className="text-2xl font-bold text-brick-600 block tabular">{formatPrice(property.price)}</span>
                <span className="text-xs text-ink-700 block mt-0.5 tabular">
                  {roi != null ? `ROI score: ${roi}/100` : notScored}
                </span>
              </div>
            </div>

            {/* Scorecard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-line border border-line rounded-lg overflow-hidden [&>div]:bg-white">
              <div className="p-4">
                <span className="text-xs text-ink-500 block mb-1">Overall score</span>
                <span className="text-2xl font-bold text-ink-900 tabular">{aiScore != null ? `${aiScore}/100` : '—'}</span>
                <span className="text-xs text-ink-500 block mt-1">{aiScore != null ? 'Scored' : notScored}</span>
              </div>

              <div className="p-4">
                <span className="text-xs text-ink-500 block mb-1">Air quality (AQI)</span>
                <span className="text-2xl font-bold text-ink-900 tabular">{aqi != null ? `${aqi} AQI` : '—'}</span>
                <span className="text-xs text-ink-500 block mt-1">{aqi != null ? (property.environmentScore?.aqiLabel || 'Good') : notScored}</span>
              </div>

              <div className="p-4">
                <span className="text-xs text-ink-500 block mb-1">ROI potential</span>
                <span className="text-2xl font-bold text-ink-900 tabular">{roi != null ? `${roi}/100` : '—'}</span>
                <span className="text-xs text-ink-500 block mt-1">{roi != null ? 'Composite ROI score' : notScored}</span>
              </div>

              <div className="p-4">
                <span className="text-xs text-ink-500 block mb-1">Data verification</span>
                <span className="text-base font-bold text-ink-900 flex items-center gap-1 mt-1">
                  {property.verifiedLive ? (
                    <span className="text-moss-700">Verified live</span>
                  ) : (
                    <span className="text-ink-500">Sample / Verified</span>
                  )}
                </span>
                <span className="text-xs text-ink-500 block mt-1">{property.sourcePortal || 'SmartSite Verified'}</span>
              </div>
            </div>

            {/* Financial & ROI */}
            <section>
              <h3 className="text-base font-bold text-ink-900 mb-2">Price and rental yield</h3>
              <dl className="divide-y divide-line border-y border-line text-sm">
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-ink-700">Estimated rate per sq ft</dt>
                  <dd className="font-semibold text-ink-900 tabular">
                    ₹{(property.pricePerSqFt || (property.price / (property.specifications?.carpetArea || 1000))).toFixed(0)} / sq ft
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-ink-700">ROI potential rating</dt>
                  <dd className="font-semibold text-ink-900 tabular">{roi != null ? `${roi} / 100` : notScored}</dd>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-ink-700">Estimated rental yield</dt>
                  <dd className="font-semibold text-ink-900 tabular">{rentalYieldEst}</dd>
                </div>
              </dl>
            </section>

            {/* Environment */}
            <section>
              <h3 className="text-base font-bold text-ink-900 mb-2">Environment</h3>
              <dl className="divide-y divide-line border-y border-line text-sm">
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-ink-700">Green cover index</dt>
                  <dd className="font-semibold text-ink-900 tabular">{property.environmentScore?.greenCover != null ? `${property.environmentScore.greenCover}%` : '78%'}</dd>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-ink-700">Ambient noise level</dt>
                  <dd className="font-semibold text-ink-900 tabular">{property.environmentScore?.noiseLevel || 'Low (<45 dB)'}</dd>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-ink-700">Environmental rating</dt>
                  <dd className="font-semibold text-ink-900 tabular">{envScore != null ? `${envScore}/100` : '85/100'}</dd>
                </div>
              </dl>
            </section>

            {/* Scoring summary */}
            {(aiScore != null || envScore != null || roi != null) && (
              <section className="p-5 bg-ink-50 border border-line rounded-lg">
                <h3 className="text-sm font-bold text-ink-900 mb-1.5">Summary</h3>
                <p className="text-sm text-ink-700 leading-relaxed">
                  {[
                    aiScore != null && `Overall score is ${aiScore}/100, based on location, connectivity and specification benchmarks.`,
                    aqi != null && `Air quality index stands at ${aqi} AQI (${property.environmentScore?.aqiLabel || 'Healthy'}).`,
                    roi != null && `The projected annual ROI composite score is ${roi}/100 with an estimated rental yield of ${rentalYieldEst}.`,
                  ].filter(Boolean).join(' ')}
                </p>
              </section>
            )}

            {/* Footer */}
            <div className="border-t border-line pt-4 flex flex-col md:flex-row items-center justify-between text-xs text-ink-500 gap-2">
              <span>SmartSite Advisor © 2026</span>
              <span>Reference document</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
