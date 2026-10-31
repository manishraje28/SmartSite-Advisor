import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ScoreRing from '../ui/ScoreRing';

export default function AILivePreview() {
  const [roiWeight, setRoiWeight] = useState(40);
  const [transitWeight, setTransitWeight] = useState(30);
  const [amenityWeight, setAmenityWeight] = useState(30);
  const [selectedProperty, setSelectedProperty] = useState('sobha');

  const properties = {
    sobha: {
      name: "Sample: 2 BHK in Kharghar",
      city: "Kharghar, Navi Mumbai",
      price: "₹95.0 Lakhs",
      baseRoi: 88,
      baseTransit: 82,
      baseAmenity: 94,
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      verdict: "High yield rental option with 94/100 internal amenities rating."
    },
    brigade: {
      name: "Sample: 3 BHK in Powai",
      city: "Powai, Mumbai",
      price: "₹1.80 Cr",
      baseRoi: 92,
      baseTransit: 96,
      baseAmenity: 88,
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      verdict: "Top-tier transit connectivity with direct access to metro and world trade center."
    },
    prestige: {
      name: "Sample: 2 BHK on Ghodbunder Road",
      city: "Ghodbunder Road, Thane",
      price: "₹1.20 Cr",
      baseRoi: 84,
      baseTransit: 78,
      baseAmenity: 96,
      image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      verdict: "Best family community with pristine air quality score of AQI 42."
    }
  };

  const currentProp = properties[selectedProperty];

  // Calculate weighted score live
  const totalWeight = roiWeight + transitWeight + amenityWeight;
  const score = Math.round(
    ((currentProp.baseRoi * roiWeight) +
     (currentProp.baseTransit * transitWeight) +
     (currentProp.baseAmenity * amenityWeight)) / totalWeight
  );

  return (
    <div className="glass-card p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-line flex-wrap gap-4">
        <div>
          <h4 className="text-base font-bold text-ink-900">Try the score weights</h4>
          <p className="text-sm text-ink-500">Move the sliders to see how the score changes.</p>
        </div>

        <div className="inline-flex rounded-md border border-ink-200 overflow-hidden divide-x divide-ink-200">
          {Object.keys(properties).map((key) => (
            <button
              key={key}
              onClick={() => setSelectedProperty(key)}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                selectedProperty === key
                  ? 'bg-ink-900 text-white'
                  : 'bg-white text-ink-700 hover:bg-ink-50'
              }`}
            >
              {properties[key].city.split(',')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Sliders */}
        <div className="lg:col-span-6 space-y-5">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-semibold text-ink-800">Investment ROI weight</span>
              <span className="text-ink-700 tabular">{roiWeight}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="80"
              value={roiWeight}
              onChange={(e) => setRoiWeight(Number(e.target.value))}
              className="w-full cursor-pointer accent-ink-800"
            />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-semibold text-ink-800">Commute and transit weight</span>
              <span className="text-ink-700 tabular">{transitWeight}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="80"
              value={transitWeight}
              onChange={(e) => setTransitWeight(Number(e.target.value))}
              className="w-full cursor-pointer accent-ink-800"
            />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-semibold text-ink-800">Amenities and comfort weight</span>
              <span className="text-ink-700 tabular">{amenityWeight}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="80"
              value={amenityWeight}
              onChange={(e) => setAmenityWeight(Number(e.target.value))}
              className="w-full cursor-pointer accent-ink-800"
            />
          </div>
        </div>

        {/* Preview card */}
        <div className="lg:col-span-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedProperty + score}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="rounded-lg p-4 border border-line flex items-center gap-4"
            >
              <img
                src={currentProp.image}
                alt={currentProp.name}
                className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-lg font-bold text-brick-600 tabular">{currentProp.price}</div>
                <h5 className="font-semibold text-ink-900 text-sm truncate">{currentProp.name}</h5>
                <p className="text-xs text-ink-500 truncate mb-1.5">{currentProp.city}</p>
                <p className="text-xs text-ink-700 leading-snug line-clamp-2">{currentProp.verdict}</p>
              </div>
              <div className="flex-shrink-0 text-center">
                <ScoreRing score={score} size={64} label="Match" />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
