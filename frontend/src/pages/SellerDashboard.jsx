import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sellerAPI } from '../services/api';
import ScoreRing from '../components/ui/ScoreRing';
import ConstructorUpgradeWidget from '../components/agents/ConstructorUpgradeWidget';
import { Plus, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

// Chart colours mirror the ink / moss tokens in index.css (recharts needs hex).
const INK_700 = '#2c3b52';
const INK_500 = '#4f6584';
const MOSS_600 = '#2f6a4b';
const LINE = '#dfe2e7';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-line rounded-md px-3 py-2 text-xs">
        <p className="font-semibold text-ink-900 mb-1">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color }} className="leading-relaxed tabular">{entry.name}: {entry.value}</p>
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
    // Poll for real-time updates every 5 seconds to simulate real-time sockets
    const interval = setInterval(fetchDataSilently, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchDataSilently = async () => {
    try {
      const [insRes, anaRes] = await Promise.all([
        sellerAPI.getInsights({ sellerId: user?._id }),
        sellerAPI.getAnalytics(user?._id),
      ]);
      if (insRes.data.success) {
        const newInsights = insRes.data.data.insights || insRes.data.data || [];
        setInsights(newInsights);

        // Ensure UI updates if currently selected property data changed
        setSelectedProperty(current => {
          if (!current && newInsights.length > 0) return newInsights[0];
          if (current) {
            const updatedProfile = newInsights.find(i => i._id === current._id);
            return updatedProfile || current;
          }
          return current;
        });
      }
      if (anaRes.data.success) {
        setAnalytics(anaRes.data.data);
      }
    } catch (err) {
      console.error('Silently failed to load seller data:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await fetchDataSilently();
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
      <div className="container-app pt-8 pb-12 flex justify-center">
        <div className="w-8 h-8 border-4 border-ink-100 border-t-ink-700 rounded-full animate-spin" role="status" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="container-app pt-8 pb-12">
      {/* Header */}
      <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink-900">Seller dashboard</h1>
          <p className="text-sm text-ink-500 mt-1 tabular">
            Views, inquiries and scores for your {insights.length} listings
          </p>
        </div>
        <Link to="/seller/properties/create" className="btn-primary flex items-center gap-2 no-underline text-sm">
          <Plus size={16} />
          Add property
        </Link>
      </div>

      {/* Stats Row */}
      <div className="glass-card grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-line mb-8">
        {[
          { label: 'Average score', value: avgScore },
          { label: 'Total views', value: totalViews.toLocaleString() },
          { label: 'Total saves', value: totalSaves.toLocaleString() },
          { label: 'Inquiries', value: totalInquiries.toLocaleString() },
        ].map((stat) => (
          <div key={stat.label} className="p-5">
            <div className="text-xs text-ink-500 mb-1">{stat.label}</div>
            <div className="text-2xl font-bold text-ink-900 tabular">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* ── Left Column ── */}
        <div className="space-y-6">
          {/* Trend Chart */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-ink-900 mb-4">Weekly views and inquiries</h2>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={trendData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <XAxis dataKey="week" stroke={INK_500} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke={INK_500} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="views" name="Views" stroke={INK_700} fill={INK_700} fillOpacity={0.08} strokeWidth={2} />
                  <Area type="monotone" dataKey="inquiries" name="Inquiries" stroke={MOSS_600} fill={MOSS_600} fillOpacity={0.08} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-ink-500 text-sm">
                No trend data yet
              </div>
            )}
          </div>

          {/* Constructor Upgrade Widget */}
          <ConstructorUpgradeWidget property={selectedProperty || insights[0]?.property} />

          {/* Properties List */}
          <div className="glass-card">
            <h2 className="text-lg font-bold text-ink-900 px-6 pt-6 pb-3">Your listings</h2>
            <div className="divide-y divide-line border-t border-line">
              {insights.map((insight, i) => {
                const prop = insight.property || {};
                const score = insight.currentScore?.overall || 0;
                const isSelected = selectedProperty?._id === insight._id;
                return (
                  <div
                    key={insight._id}
                    onClick={() => setSelectedProperty(insight)}
                    className={`flex items-center gap-4 px-6 py-3.5 cursor-pointer transition-colors border-l-2 ${isSelected ? 'bg-ink-50 border-l-ink-900' : 'border-l-transparent hover:bg-ink-50'}`}
                  >
                    <div className="w-14 h-14 rounded-md overflow-hidden flex-shrink-0 bg-ink-100">
                      <img
                        src={prop.images?.[0] || '/images/property-1.png'}
                        alt={prop.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-ink-900 truncate">{prop.title || `Property #${i + 1}`}</div>
                      <div className="text-xs text-ink-500 mt-0.5">{prop.location?.city || 'N/A'} · {insight.demandLevel}</div>
                    </div>
                    <ScoreRing score={score} size={44} strokeWidth={4} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Right Column ── */}
        <div className="space-y-5">
          {/* Radar Chart */}
          {radarData.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="text-base font-bold text-ink-900 mb-4">Score breakdown</h2>
              <ResponsiveContainer width="100%" height={210}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={LINE} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: INK_500, fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Score" dataKey="A" stroke={INK_700} fill={INK_700} fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Suggestions */}
          <div className="glass-card p-6">
            <h2 className="text-base font-bold text-ink-900 mb-3">Suggested improvements</h2>
            <div className="divide-y divide-line">
              {(selectedProperty?.improvementSuggestions || []).slice(0, 4).map((sug, i) => {
                const priorityColors = {
                  high: { icon: AlertTriangle, color: 'text-[#8a5a0b]' },
                  medium: { icon: Info, color: 'text-ink-500' },
                  low: { icon: CheckCircle2, color: 'text-moss-600' },
                };
                const p = priorityColors[sug.priority] || priorityColors.medium;
                return (
                  <div key={i} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start gap-2.5">
                      <p.icon size={15} className={`${p.color} mt-0.5 flex-shrink-0`} />
                      <div>
                        <p className="text-sm text-ink-900 leading-relaxed">{sug.message}</p>
                        {sug.impact && (
                          <span className="text-xs text-ink-500 mt-1 inline-block tabular">
                            Impact: +{sug.impact}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {(!selectedProperty?.improvementSuggestions || selectedProperty.improvementSuggestions.length === 0) && (
                <p className="text-sm text-ink-500 py-4">Select a listing to see suggestions.</p>
              )}
            </div>
          </div>

          {/* Buyer Segments */}
          {segmentData.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="text-base font-bold text-ink-900 mb-4">Buyer segments</h2>
              <div className="space-y-4">
                {segmentData.map(seg => (
                  <div key={seg.segment}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-ink-700">{seg.segment}</span>
                      <span className="font-semibold text-ink-900 tabular">{seg.match}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${seg.match}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full rounded-full bg-ink-700"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
