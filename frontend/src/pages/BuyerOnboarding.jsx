import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { buyerAPI } from '../services/api';
import { MapPin, IndianRupee, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const WEIGHT_FIELDS = [
  { key: 'price', label: 'Price fit', description: 'How well it fits your budget' },
  { key: 'location', label: 'Location quality', description: 'Area popularity, safety, growth' },
  { key: 'amenities', label: 'Amenities', description: 'Gym, pool, security, etc.' },
  { key: 'connectivity', label: 'Connectivity', description: 'Transit, highway, business hub access' },
  { key: 'roiPotential', label: 'ROI potential', description: 'Rental yield & appreciation outlook' },
];

const DEFAULT_WEIGHTS = { price: 0.35, location: 0.30, amenities: 0.20, connectivity: 0.10, roiPotential: 0.05 };

export default function BuyerOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    preferredPropertyTypes: ['Apartment'],
    listingPreference: 'Sale',
    budget: { min: 0, max: 15000000 },
    preferredLocations: ['Mumbai'],
    weights: DEFAULT_WEIGHTS,
  });

  // Pre-fill from existing preferences if this buyer already has some saved
  // (so revisiting this page to adjust settings doesn't silently reset them to defaults).
  useEffect(() => {
    if (!user?._id) {
      setLoadingExisting(false);
      return;
    }
    buyerAPI.getPreferences(user._id)
      .then((res) => {
        const existing = res.data?.data;
        if (existing) {
          setForm({
            preferredPropertyTypes: existing.preferredPropertyTypes?.length ? existing.preferredPropertyTypes : ['Apartment'],
            listingPreference: existing.listingPreference || 'Sale',
            budget: { min: existing.budget?.min || 0, max: existing.budget?.max || 15000000 },
            preferredLocations: existing.preferredLocations?.length ? existing.preferredLocations : [],
            weights: existing.weights || DEFAULT_WEIGHTS,
          });
        }
      })
      .catch(() => {
        // 404 (no preferences yet) is the expected case for a first-time buyer — keep defaults.
      })
      .finally(() => setLoadingExisting(false));
  }, [user?._id]);

  const propertyTypes = ['Apartment', 'Villa', 'Plot', 'Commercial'];

  const togglePropertyType = (type) => {
    setForm(prev => ({
      ...prev,
      preferredPropertyTypes: prev.preferredPropertyTypes.includes(type)
        ? prev.preferredPropertyTypes.filter(t => t !== type)
        : [...prev.preferredPropertyTypes, type]
    }));
  };

  const handleLocationChange = (e) => {
    const locs = e.target.value.split(',').map(l => l.trim()).filter(Boolean);
    setForm(prev => ({ ...prev, preferredLocations: locs }));
  };

  // Moving one priority slider proportionally redistributes the difference across
  // the other four, so the five weights always sum to 1.0 (required by the backend's
  // validateWeights) without the user having to do the arithmetic themselves.
  const handleWeightChange = (key, rawValue) => {
    const newValue = Math.max(0, Math.min(1, rawValue));
    setForm(prev => {
      const oldWeights = prev.weights;
      const delta = newValue - oldWeights[key];
      const otherKeys = WEIGHT_FIELDS.map(f => f.key).filter(k => k !== key);
      const othersSum = otherKeys.reduce((s, k) => s + oldWeights[k], 0);

      const updated = { ...oldWeights, [key]: newValue };
      if (othersSum > 1e-6) {
        otherKeys.forEach(k => {
          const share = oldWeights[k] / othersSum;
          updated[k] = Math.max(0, oldWeights[k] - delta * share);
        });
      }

      // Guard against floating-point drift so the sum stays exactly 1.0.
      const sum = WEIGHT_FIELDS.reduce((s, f) => s + updated[f.key], 0);
      if (sum > 1e-6) {
        WEIGHT_FIELDS.forEach(f => { updated[f.key] = updated[f.key] / sum; });
      }
      return { ...prev, weights: updated };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // savePreferences (POST) upserts — required here since a first-time buyer has
      // no existing preferences doc yet, unlike updatePreferences (PATCH) which 404s
      // on nothing-to-update.
      await buyerAPI.savePreferences({ ...form, buyerId: user?._id });
      navigate('/buyer/dashboard');
    } catch (err) {
      console.error('Failed to save preferences', err);
      setError(err.response?.data?.message || 'Failed to save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-page pb-12">
      <div className="container-app pt-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
          <h1 className="text-3xl font-bold text-ink-900 tracking-tight">Your home search preferences</h1>
          <p className="text-sm text-ink-500 mt-1 mb-6">Tell us what you're looking for and we'll work out a match percentage for each listing.</p>

          {error && (
            <div role="alert" className="mb-6 p-3.5 rounded-md bg-[#fdf1f0] border border-[#f6d3cf] text-[#b42318] text-sm font-medium flex items-start gap-2">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="bg-white border border-line rounded-lg p-6 md:p-8 space-y-6">
            <fieldset>
              <legend className="label-sm block mb-2">Property types</legend>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {propertyTypes.map(type => {
                  const selected = form.preferredPropertyTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => togglePropertyType(type)}
                      className={`h-10 px-3 rounded-md text-sm font-semibold border transition-colors ${
                        selected
                          ? 'bg-ink-900 border-ink-900 text-white'
                          : 'bg-white border-ink-200 text-ink-700 hover:border-ink-400'
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <label htmlFor="pref-locations" className="label-sm block mb-1.5">Cities or localities</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  id="pref-locations"
                  type="text"
                  placeholder="e.g. Whitefield, Indiranagar, Bandra (comma separated)"
                  value={form.preferredLocations.join(', ')}
                  onChange={handleLocationChange}
                  className="input-field !pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pref-budget" className="label-sm block mb-1.5">Maximum budget (₹)</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                  <input
                    id="pref-budget"
                    type="number"
                    min="0"
                    value={form.budget.max}
                    onChange={e => setForm(prev => ({...prev, budget: {...prev.budget, max: Number(e.target.value)}}))}
                    className="input-field !pl-10 tabular"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="pref-intent" className="label-sm block mb-1.5">Looking to</label>
                <select
                  id="pref-intent"
                  value={form.listingPreference}
                  onChange={e => setForm(prev => ({...prev, listingPreference: e.target.value}))}
                  className="input-field cursor-pointer"
                >
                  <option value="Sale">Buy</option>
                  <option value="Rent">Rent</option>
                  <option value="Any">Either</option>
                </select>
              </div>
            </div>

            {/* Scoring priority sliders — these directly become the weights the matching
                formula uses (calculateMatchForProperty), so buyers can steer which factors
                matter most to them instead of a fixed one-size-fits-all formula. */}
            <fieldset className="pt-6 border-t border-line">
              <legend className="text-base font-bold text-ink-900">What matters most</legend>
              <p className="text-sm text-ink-500 mt-1 mb-4">
                Drag to set what matters most. The others adjust automatically so the total is always 100%.
              </p>
              <div className="divide-y divide-line">
                {WEIGHT_FIELDS.map(({ key, label, description }) => (
                  <div key={key} className="py-3">
                    <div className="flex items-baseline justify-between gap-4">
                      <label htmlFor={`weight-${key}`} className="text-sm font-semibold text-ink-900">{label}</label>
                      <span className="text-sm font-semibold text-ink-900 tabular">{Math.round(form.weights[key] * 100)}%</span>
                    </div>
                    <p className="text-xs text-ink-500 mb-1.5">{description}</p>
                    <input
                      id={`weight-${key}`}
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round(form.weights[key] * 100)}
                      onChange={(e) => handleWeightChange(key, Number(e.target.value) / 100)}
                      className="w-full accent-brick-600 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </fieldset>

            <button
              type="submit"
              disabled={loading || loadingExisting}
              className="btn-primary w-full !py-3 text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Save and see my matches</span>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
