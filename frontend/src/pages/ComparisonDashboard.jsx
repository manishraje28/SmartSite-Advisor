import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { buyerAPI, propertyAPI } from '../services/api';
import ScoreRing from '../components/ui/ScoreRing';
import {
  GitCompare, Trophy, MapPin, Bed, Bath, Maximize,
  Sparkles, CheckCircle2, AlertTriangle, TrendingUp, Zap, ChevronDown
} from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts';
import ExplainerChatbot from '../components/ui/ExplainerChatbot';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

export default function ComparisonDashboard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [comparedProperties, setComparedProperties] = useState([]);
  const [winner, setWinner] = useState(null);
  const [allProperties, setAllProperties] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const idsParam = searchParams.get('ids');
    if (idsParam) {
      const ids = idsParam.split(',');
      setSelectedIds(ids);
      fetchComparison(ids);
    } else {
      fetchAllProperties();
    }
  }, [searchParams]);

  const fetchAllProperties = async () => {
    setLoading(true);
    try {
      const res = await propertyAPI.getAll();
      if (res.data.success) {
        setAllProperties(res.data.data.properties || res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch properties');
    }
    setLoading(false);
  };

  const fetchComparison = async (ids) => {
    setLoading(true);
    try {
      const { data } = await buyerAPI.compareProperties({
        propertyIds: ids,
        buyerId: user?._id,
      });
      if (data.success) {
        setComparedProperties(data.data.properties);
        setWinner(data.data.winner);
      }
    } catch (err) {
      try {
        const promises = ids.map(id => propertyAPI.getById(id));
        const results = await Promise.all(promises);
        const props = results.map(r => r.data.data || r.data).filter(Boolean);
        setComparedProperties(props);
      } catch { }
    }
    setLoading(false);
  };

  const toggleId = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const handleCompare = () => {
    if (selectedIds.length >= 2) {
      fetchComparison(selectedIds);
    }
  };

  const radarData = comparedProperties.length > 0
    ? ['Livability', 'Connectivity', 'Amenities', 'Environment', 'ROI'].map(label => {
      const point = { subject: label };
      comparedProperties.forEach((prop, i) => {
        const scoreKey = label === 'Livability'
          ? (prop.livabilityScore || prop.aiScore?.locationScore)
          : label === 'Connectivity'
            ? (prop.connectivityScore || prop.aiScore?.connectivityScore)
            : label === 'Amenities'
              ? prop.aiScore?.amenitiesScore
              : label === 'Environment'
                ? prop.environmentScore?.overall
                : prop.aiScore?.roiPotential;
        point[`prop${i}`] = scoreKey || 50;
      });
      return point;
    })
    : [];

  const formatPrice = (p) => {
    if (p >= 10000000) return `₹${(p / 10000000).toFixed(1)} Cr`;
    if (p >= 100000) return `₹${(p / 100000).toFixed(0)} L`;
    return `₹${p?.toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <div className="container-app py-6 pb-12">
        <div className="glass-card h-96 animate-pulse" />
      </div>
    );
  }

  // Selection Mode
  if (comparedProperties.length === 0) {
    return (
      <div className="container-app py-6 pb-12">
        <motion.div initial="hidden" animate="visible" className="mb-6">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2.5 mb-1.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center">
              <GitCompare size={18} className="text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">Property Comparison</h1>
              <p className="text-xs text-on-surface-variant">Select 2-4 properties to compare side by side</p>
            </div>
          </motion.div>
        </motion.div>

        <motion.div initial="hidden" animate="visible" className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {allProperties.map((prop, i) => (
            <motion.div
              key={prop._id}
              variants={fadeUp}
              custom={i}
              onClick={() => toggleId(prop._id)}
              className={`glass-card p-4 cursor-pointer transition-all ${selectedIds.includes(prop._id)
                  ? 'border-indigo-500/40 bg-indigo-500/5'
                  : 'hover:bg-white/3'
                }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={prop.images?.[0] || '/images/property-1.png'} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{prop.title}</div>
                  <div className="text-xs text-on-surface-variant mt-1">{formatPrice(prop.price)}</div>
                  <div className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                    <MapPin size={10} /> {prop.location?.city}
                  </div>
                </div>
                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${selectedIds.includes(prop._id)
                    ? 'bg-indigo-500 border-indigo-500'
                    : 'border-on-surface-variant/30'
                  }`}>
                  {selectedIds.includes(prop._id) && <CheckCircle2 size={14} className="text-white" />}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {selectedIds.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
          >
            <button onClick={handleCompare} className="btn-primary !px-8 !py-3.5 flex items-center gap-2 shadow-glow-indigo text-base">
              <GitCompare size={18} />
              Compare {selectedIds.length} Properties
            </button>
          </motion.div>
        )}
      </div>
    );
  }

  // Comparison View
  return (
    <div className="container-app py-6 pb-12">
      {/* Header */}
      <motion.div initial="hidden" animate="visible" className="mb-8">
        <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center">
            <GitCompare size={18} className="text-indigo-400" />
          </div>
          <h1 className="text-xl font-bold leading-tight">Property Comparison</h1>
        </motion.div>

        {/* Winner Banner */}
        {winner && (
          <motion.div variants={fadeUp} custom={1}
            className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 border border-emerald-500/15 flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Trophy size={20} className="text-amber-400" />
            </div>
            <div>
              <div className="font-semibold text-sm text-on-surface mb-1">
                🏆 AI Recommends: <span className="text-emerald-400">{winner.title}</span>
              </div>
              {winner.explanation?.map((exp, i) => (
                <div key={i} className="text-xs text-on-surface-variant flex items-center gap-1.5 mt-1">
                  <Sparkles size={10} className="text-primary flex-shrink-0" /> {exp}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Radar Chart */}
      <motion.div variants={fadeUp} custom={2} initial="hidden" animate="visible" className="glass-card p-6 mb-8">
        <h3 className="font-semibold mb-5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center">
            <Zap size={15} className="text-indigo-400" />
          </div>
          <span className="text-sm">Score Comparison</span>
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="rgba(42, 51, 82, 0.5)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ba3c2', fontSize: 11 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            {comparedProperties.map((prop, i) => (
              <Radar
                key={prop._id}
                name={prop.title?.split(' ').slice(0, 2).join(' ')}
                dataKey={`prop${i}`}
                stroke={COLORS[i]}
                fill={COLORS[i]}
                fillOpacity={0.15}
                strokeWidth={2}
              />
            ))}
            <Legend wrapperStyle={{ fontSize: 11, color: '#9ba3c2' }} />
          </RadarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Side-by-Side Cards */}
      <motion.div initial="hidden" animate="visible"
        className={`grid gap-5 ${comparedProperties.length === 2 ? 'md:grid-cols-2' : comparedProperties.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4'}`}
      >
        {comparedProperties.map((prop, i) => {
          const isWinner = winner?.id === prop._id;
          return (
            <motion.div
              key={prop._id}
              variants={fadeUp}
              custom={i + 3}
              className={`glass-card overflow-hidden ${isWinner ? 'border-emerald-500/30 ring-1 ring-emerald-500/20' : ''}`}
            >
              {isWinner && (
                <div className="bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 py-2 px-4 flex items-center gap-2">
                  <Trophy size={13} className="text-amber-400" />
                  <span className="text-xs font-bold text-emerald-400">Best Match</span>
                </div>
              )}

              <div className="relative h-44 overflow-hidden">
                <img src={prop.images?.[0] || '/images/property-1.png'} className="w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
                <div className="absolute bottom-3 left-4">
                  <div className="text-lg font-bold text-white drop-shadow-lg">{formatPrice(prop.price)}</div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h4 className="font-semibold text-lg mb-1">{prop.title}</h4>
                  <p className="text-sm text-on-surface-variant flex items-center gap-1.5">
                    <MapPin size={14} /> {prop.location?.city}
                  </p>
                </div>

                {/* Overall Score */}
                <div className="flex justify-center py-2">
                  <ScoreRing
                    score={prop.matchPercentage || prop.aiScore?.overall || 0}
                    size={72}
                    label={prop.matchPercentage ? 'Match' : 'Score'}
                  />
                </div>

                {/* Specs */}
                <div className="grid grid-cols-3 gap-2.5">
                  {prop.specifications?.bedrooms && (
                    <div className="text-center p-2.5 rounded-xl bg-surface-container-highest">
                      <Bed size={15} className="text-indigo-400 mx-auto mb-1.5" />
                      <div className="text-xs font-semibold">{prop.specifications.bedrooms}</div>
                      <div className="text-[10px] text-on-surface-variant mt-0.5">Beds</div>
                    </div>
                  )}
                  {prop.specifications?.bathrooms && (
                    <div className="text-center p-2.5 rounded-xl bg-surface-container-highest">
                      <Bath size={15} className="text-indigo-400 mx-auto mb-1.5" />
                      <div className="text-xs font-semibold">{prop.specifications.bathrooms}</div>
                      <div className="text-[10px] text-on-surface-variant mt-0.5">Baths</div>
                    </div>
                  )}
                  {prop.specifications?.carpetArea && (
                    <div className="text-center p-3 rounded-xl bg-surface-container-highest">
                      <Maximize size={16} className="text-indigo-400 mx-auto mb-2" />
                      <div className="text-sm font-semibold">{prop.specifications.carpetArea}</div>
                      <div className="text-xs text-on-surface-variant mt-0.5">sqft</div>
                    </div>
                  )}
                </div>

                {/* Sub Scores */}
                <div className="space-y-4">
                  {[
                    { label: 'Livability (Maps)', score: prop.livabilityScore || prop.aiScore?.locationScore },
                    { label: 'Transit & Conn.', score: prop.connectivityScore || prop.aiScore?.connectivityScore },
                    { label: 'Internal Amenities', score: prop.aiScore?.amenitiesScore },
                    { label: 'Environment', score: prop.environmentScore?.overall },
                    { label: 'ROI', score: prop.aiScore?.roiPotential },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-2">       
                        <span className="text-on-surface-variant font-medium">{item.label}</span>
                        <span className="font-semibold text-indigo-100">{item.score || 0}/100</span>
                      </div>
                      <div className="h-2 rounded-full bg-surface-container-highest overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                          style={{
                            width: `${item.score || 0}%`,
                            backgroundColor: COLORS[i],
                            boxShadow: `0 0 10px ${COLORS[i]}80`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* AI Insights */}
                {prop.insights?.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-white/5">
                    {prop.insights.map((insight, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs">
                        {insight.type === 'positive' ? (
                          <CheckCircle2 size={13} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertTriangle size={13} className="text-amber-400 mt-0.5 flex-shrink-0" />
                        )}
                        <span className="text-on-surface-variant leading-relaxed">{insight.text}</span>
                      </div>
                    ))}
                  </div>
                )}
                {/* Neighborhood & Distances */}
                {prop.topAmenitiesMap && prop.topAmenitiesMap.length > 0 && (
                  <div className="pt-4 border-t border-white/5 space-y-2.5">
                    <h5 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                      <MapPin size={14} className="text-indigo-400" /> Neighborhood Analysis
                    </h5>
                    {prop.topAmenitiesMap.map((amenity, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs bg-white/5 p-2.5 rounded-lg hover:bg-white/10 transition-colors">
                        <div className="w-[65%]">
                          <div className="text-on-surface font-medium truncate" title={amenity.name}>{amenity.name}</div>
                          <div className="text-on-surface-variant text-[9px] uppercase tracking-wider mt-0.5">
                            {amenity.type.replace('_', ' ')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-indigo-300 font-semibold">{amenity.distanceText}</div>
                          <div className="text-[10px] text-on-surface-variant mt-0.5">
                            {amenity.durationText}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Explainer AI component integrated here */}
              <ExplainerChatbot property={prop} color={COLORS[i]} />

            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
