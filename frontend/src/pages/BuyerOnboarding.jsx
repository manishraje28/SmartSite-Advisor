import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { buyerAPI } from '../../services/api';
import { MapPin, DollarSign, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function BuyerOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    preferredPropertyTypes: [],
    listingPreference: 'Sale',
    budget: { min: 0, max: 10000000 },
    preferredLocations: [],
    weights: { price: 0.35, location: 0.30, amenities: 0.20, connectivity: 0.10, roiPotential: 0.05 }
  });

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

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await buyerAPI.updatePreferences({ ...form, userId: user?._id });
      navigate('/buyer/dashboard');
    } catch (error) {
      console.error('Failed to save preferences', error);
      // Always let the user enter dashboard even if pref fails
      navigate('/buyer/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl w-full bg-white rounded-3xl p-8 shadow-xl shadow-blue-900/5 border border-slate-100">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-600/30">
            <Sparkles className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome to SmartSite</h1>
          <p className="text-slate-500 mt-2">Let's set up your AI profile to find you perfect matches.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">What are you looking for?</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {propertyTypes.map(type => (
                <button key={type} type="button" onClick={() => togglePropertyType(type)} className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all ${form.preferredPropertyTypes.includes(type) ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-blue-300'}`}>
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Preferred Locations</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input type="text" placeholder="e.g., Bandra, Andheri, Powai (comma separated)" onChange={handleLocationChange} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Max Budget</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="number" min="0" value={form.budget.max} onChange={e => setForm(prev => ({...prev, budget: {...prev.budget, max: Number(e.target.value)}}))} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Intent</label>
              <select value={form.listingPreference} onChange={e => setForm(prev => ({...prev, listingPreference: e.target.value}))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium text-slate-700">
                <option value="Sale">Buy</option>
                <option value="Rent">Rent</option>
                <option value="Any">Any</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-4 mt-6 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50">
            {loading ? 'Saving Profile...' : 'Save & Start Exploring'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}