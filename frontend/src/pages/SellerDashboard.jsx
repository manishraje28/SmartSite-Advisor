import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sellerAPI, propertyAPI } from '../services/api';
import ScoreRing from '../components/ui/ScoreRing';
import {
  BarChart3, TrendingUp, Eye, Heart, MessageCircle, Plus,
  ArrowUpRight, ChevronRight, Sparkles, Target, Zap,
  CheckCircle2, AlertTriangle, Info, Star
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card-strong px-4 py-3 text-xs rounded-xl">
        <p className="font-semibold text-on-surface mb-1">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color }} className="leading-relaxed">{entry.name}: {entry.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function SellerDashboard() {
  const { user } = useAuth();
  const [insights, setInsights] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [insRes, anaRes] = await Promise.all([
        sellerAPI.getInsights({ sellerId: user?._id }),
        sellerAPI.getAnalytics(user?._id),
      ]);
      if (insRes.data.success) {
        setInsights(insRes.data.data.insights || insRes.data.data || []);
        if (insRes.data.data.insights?.[0] || insRes.data.data[0]) {
          setSelectedProperty(insRes.data.data.insights?.[0] || insRes.data.data[0]);
        }
      }
      if (anaRes.data.success) {
        setAnalytics(anaRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load seller data:', err);
    }
    setLoading(false);
  };

  const totalViews = insights.reduce((a, ins) => a + (ins.demandStats?.totalViews || 0), 0);
  const totalSaves = insights.reduce((a, ins) => a + (ins.demandStats?.totalSaves || 0), 0);
  const totalInquiries = insights.reduce((a, ins) => a + (ins.demandStats?.totalInquiries || 0), 0);
  const avgScore = insights.length > 0
    ? Math.round(insights.reduce((a, ins) => a + (ins.currentScore?.overall || 0), 0) / insights.length)
    : 0;

  const trendData = selectedProperty?.demandStats?.weeklyTrend?.map(w => ({
    week: w.week?.split('-')[1],
    views: w.views,
    inquiries: w.inquiries,
  })) || [];

  const radarData = selectedProperty ? [
    { subject: 'Location', A: selectedProperty.currentScore?.locationScore || 0 },
    { subject: 'Connectivity', A: selectedProperty.currentScore?.connectivityScore || 0 },
    { subject: 'Amenities', A: selectedProperty.currentScore?.amenitiesScore || 0 },
    { subject: 'ROI', A: selectedProperty.currentScore?.roiPotential || 0 },
  ] : [];

  const segmentData = selectedProperty?.buyerSegmentMatch
    ? Object.entries(selectedProperty.buyerSegmentMatch).map(([seg, val]) => ({
      segment: seg.charAt(0).toUpperCase() + seg.slice(1),
      match: typeof val === 'number' ? val : 0,
    })).filter(s => s.match > 0)
    : [];

  if (loading) {
    return (
      <div className="container-app py-6 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass-card h-28 animate-pulse" />
          ))}
        </div>
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <div className="glass-card h-80 animate-pulse" />
          <div className="glass-card h-80 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="container-app py-6 pb-12">
      {/* Header */}
      <motion.div initial="hidden" animate="visible" className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <motion.div variants={fadeUp} custom={0}>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <BarChart3 size={18} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">Seller Intelligence</h1>
              <p className="text-xs text-on-surface-variant">
                AI-powered analytics for your {insights.length} properties
              </p>
            </div>
          </div>
        </motion.div>
        <motion.div variants={fadeUp} custom={1}>
          <Link to="/seller/properties/create" className="btn-primary !px-6 !py-3 flex items-center gap-2 no-underline text-sm shadow-lg shadow-indigo-500/20">
            <Plus size={16} />
            Add Property
          </Link>
        </motion.div>
      </motion.div>

      {/* Stats Row */}
      <motion.div initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Avg AI Score', value: avgScore, icon: Star, color: 'text-indigo-400', bgColor: 'from-indigo-500/15' },
          { label: 'Total Views', value: totalViews.toLocaleString(), icon: Eye, color: 'text-emerald-400', bgColor: 'from-emerald-500/15' },
          { label: 'Total Saves', value: totalSaves.toLocaleString(), icon: Heart, color: 'text-pink-400', bgColor: 'from-pink-500/15' },
          { label: 'Inquiries', value: totalInquiries.toLocaleString(), icon: MessageCircle, color: 'text-amber-400', bgColor: 'from-amber-500/15' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            variants={fadeUp}
            custom={i}
            className={`glass-card p-6 bg-gradient-to-br ${stat.bgColor} to-transparent`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl ${stat.bgColor.replace('from-', 'bg-').replace('/15', '/10')} flex items-center justify-center`}>
                <stat.icon size={17} className={stat.color} />
              </div>
              <ArrowUpRight size={14} className="text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-on-surface mb-0.5">{stat.value}</div>
            <div className="text-xs text-on-surface-variant">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* ── Left Column ── */}
        <div className="space-y-6">
          {/* Trend Chart */}
          <motion.div variants={fadeUp} custom={2} initial="hidden" animate="visible" className="glass-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                  <TrendingUp size={15} className="text-emerald-400" />
                </div>
                <span className="text-sm">Weekly Engagement Trend</span>
              </h3>
            </div>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={trendData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorInq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="week" stroke="#6b7499" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7499" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="views" name="Views" stroke="#6366f1" fill="url(#colorViews)" strokeWidth={2} />
                  <Area type="monotone" dataKey="inquiries" name="Inquiries" stroke="#10b981" fill="url(#colorInq)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-on-surface-variant text-sm">
                No trend data available
              </div>
            )}
          </motion.div>

          {/* Properties List */}
          <motion.div variants={fadeUp} custom={3} initial="hidden" animate="visible" className="glass-card p-6">
            <h3 className="font-semibold flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                <Target size={15} className="text-indigo-400" />
              </div>
              <span className="text-sm">Your Properties</span>
            </h3>
            <div className="space-y-3">
              {insights.map((insight, i) => {
                const prop = insight.property || {};
                const score = insight.currentScore?.overall || 0;
                const isSelected = selectedProperty?._id === insight._id;
                return (
                  <motion.div
                    key={insight._id}
                    whileHover={{ x: 4 }}
                    onClick={() => setSelectedProperty(insight)}
                    className={`flex items-center gap-4 p-3.5 rounded-xl cursor-pointer transition-all duration-200 ${isSelected ? 'bg-indigo-500/10 border border-indigo-500/15' : 'bg-surface-container-highest/40 hover:bg-surface-container-highest/70 border border-transparent'
                      }`}
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={prop.images?.[0] || '/images/property-1.png'}
                        alt={prop.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-on-surface truncate">{prop.title || `Property #${i + 1}`}</div>
                      <div className="text-xs text-on-surface-variant mt-0.5">{prop.location?.city || 'N/A'} • {insight.demandLevel}</div>
                    </div>
                    <ScoreRing score={score} size={44} strokeWidth={4} />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* ── Right Column ── */}
        <div className="space-y-5">
          {/* Radar Chart */}
          {radarData.length > 0 && (
            <motion.div variants={fadeUp} custom={4} initial="hidden" animate="visible" className="glass-card p-6">
              <h4 className="font-semibold text-sm mb-4 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                  <Zap size={13} className="text-indigo-400" />
                </div>
                Score Breakdown
              </h4>
              <ResponsiveContainer width="100%" height={210}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(42, 51, 82, 0.5)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ba3c2', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Score" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* AI Suggestions */}
          <motion.div variants={fadeUp} custom={5} initial="hidden" animate="visible" className="glass-card p-6">
            <h4 className="font-semibold text-sm mb-5 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <Sparkles size={13} className="text-emerald-400" />
              </div>
              AI Suggestions
            </h4>
            <div className="space-y-3">
              {(selectedProperty?.improvementSuggestions || []).slice(0, 4).map((sug, i) => {
                const priorityColors = {
                  high: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                  medium: { icon: Info, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                  low: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                };
                const p = priorityColors[sug.priority] || priorityColors.medium;
                return (
                  <div key={i} className={`p-3.5 rounded-xl ${p.bg}`}>
                    <div className="flex items-start gap-2.5">
                      <p.icon size={15} className={`${p.color} mt-0.5 flex-shrink-0`} />
                      <div>
                        <p className="text-xs text-on-surface leading-relaxed">{sug.message}</p>
                        {sug.impact && (
                          <span className="text-[10px] text-on-surface-variant mt-1.5 inline-block font-medium">
                            Impact: +{sug.impact}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {(!selectedProperty?.improvementSuggestions || selectedProperty.improvementSuggestions.length === 0) && (
                <p className="text-xs text-on-surface-variant text-center py-6">Select a property to see suggestions</p>
              )}
            </div>
          </motion.div>

          {/* Buyer Segments */}
          {segmentData.length > 0 && (
            <motion.div variants={fadeUp} custom={6} initial="hidden" animate="visible" className="glass-card p-6">
              <h4 className="font-semibold text-sm mb-5 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                  <Target size={13} className="text-indigo-400" />
                </div>
                Buyer Segments
              </h4>
              <div className="space-y-6">
                {segmentData.map(seg => (
                  <div key={seg.segment}>
                    <div className="flex justify-between text-sm mb-2.5">
                      <span className="text-on-surface-variant">{seg.segment}</span>
                      <span className="font-semibold text-on-surface">{seg.match}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-surface-container-highest overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${seg.match}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
