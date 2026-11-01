import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { propertyAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ScoreRing from '../components/ui/ScoreRing';
import ExplainerChatbot from '../components/ui/ExplainerChatbot';
import NegotiationAdvisorModal from '../components/agents/NegotiationAdvisorModal';
import PropertyMapView from '../components/property/PropertyMapView';
import PropertyReportModal from '../components/property/PropertyReportModal';
import { 
  Building2, MapPin, Bed, Bath, Maximize, ArrowLeft, Heart, 
  Share2, CloudSun, ShieldCheck, Phone, Mail, Check,
  TrendingUp, Compass, Calendar, DollarSign, Handshake, FileText
} from 'lucide-react';

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isNegotiationOpen, setIsNegotiationOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [activePois, setActivePois] = useState([]);
  const [poiCategory, setPoiCategory] = useState(null);

  useEffect(() => {
    if (id) fetchPropertyDetails();
  }, [id]);

  const fetchPropertyDetails = async () => {
    setLoading(true);
    try {
      const res = await propertyAPI.getById(id);
      if (res.data?.success) {
        setProperty(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load property details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (isSaved || !property?._id) return;
    try {
      await propertyAPI.saveProperty(property._id);
      setIsSaved(true);
    } catch (e) {
      console.error('Failed to save property:', e);
    }
  };

  const formatPrice = (p) => {
    if (!p) return 'Price on Request';
    if (p >= 10000000) return `₹${(p / 10000000).toFixed(2)} Cr`;
    if (p >= 100000) return `₹${(p / 100000).toFixed(2)} L`;
    return `₹${p.toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <div className="container-app py-12 flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-ink-100 border-t-ink-700 rounded-full animate-spin" />
          <span className="text-sm font-semibold text-ink-500">Loading property…</span>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container-app py-16 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
          <Building2 size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Property Not Found</h2>
        <p className="text-slate-500 text-sm mb-6">The requested property is no longer available or was removed.</p>
        <button onClick={() => navigate(-1)} className="btn-primary !px-6 !py-2.5">
          Go Back
        </button>
      </div>
    );
  }

  const { title, price, location, specifications, amenities, images, propertyType, aiScore, environmentScore, seller, priceFairness } = property;
  const match = aiScore?.overall ?? null;
  const fairnessColor = {
    above: 'text-amber-600',
    below: 'text-moss-600',
    fair: 'text-slate-600',
  }[priceFairness?.label];
  const fairnessShort = {
    above: `${priceFairness?.differencePct}% above nearby listings`,
    below: `${Math.abs(priceFairness?.differencePct ?? 0)}% below nearby listings`,
    fair: 'In line with nearby listings',
  }[priceFairness?.label];

  return (
    <div className="container-app pt-6 pb-16">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-ink-900 mb-5 transition-colors"
      >
        <ArrowLeft size={16} /> Back to listings
      </button>

      {/* Top Title & Actions Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge-ai">{propertyType || 'Apartment'}</span>
            {environmentScore?.overall && (
              <span className="badge-success">
                <CloudSun size={12} /> AQI {environmentScore.aqi ?? 'N/A'}{environmentScore.aqiLabel ? ` (${environmentScore.aqiLabel})` : ''}
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-ink-900 tracking-tight mb-1">{title}</h1>
          <p className="text-sm text-ink-500 flex items-center gap-1.5">
            <MapPin size={14} />
            {location?.address || location?.city || 'Location Details'}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="text-left md:text-right mr-4">
            <div className="text-xs text-ink-500 font-semibold">Asking price</div>
            <div className="text-3xl font-bold text-brick-600 tabular">{formatPrice(price)}</div>
            {fairnessShort && (
              <div className={`text-xs font-bold mt-0.5 ${fairnessColor}`}>{fairnessShort}</div>
            )}
          </div>
          <button
            onClick={handleSave}
            aria-label={isSaved ? 'Saved' : 'Save property'}
            className={`p-3 rounded-md border transition-colors ${
              isSaved ? 'bg-brick-50 border-brick-200 text-brick-600' : 'bg-white border-ink-200 text-ink-600 hover:text-brick-600'
            }`}
          >
            <Heart size={20} className={isSaved ? "fill-brick-600" : ""} />
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image Gallery & Specifications */}
        <div className="lg:col-span-8 space-y-8">
          {/* Main Image */}
          <div className="relative h-[420px] rounded-lg overflow-hidden bg-ink-900">
            <img 
              src={images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'} 
              alt={title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                {match !== null ? (
                  <ScoreRing score={match} size={64} label="Match" />
                ) : (
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/40 flex items-center justify-center text-center px-1">
                    <span className="text-[9px] font-semibold text-white/60 leading-tight">Not yet scored</span>
                  </div>
                )}
                <div>
                  <div className="text-lg font-bold">SmartSite score</div>
                  <div className="text-xs text-ink-100">Based on lifestyle factors and location connectivity</div>
                </div>
              </div>
            </div>
          </div>

          {/* Specifications Bar */}
          <div className="glass-card grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-line">
            {[
              { icon: Bed, value: `${specifications?.bedrooms || 0} BHK`, label: 'Bedrooms' },
              { icon: Bath, value: specifications?.bathrooms || 0, label: 'Bathrooms' },
              { icon: Maximize, value: `${Number(specifications?.carpetArea || 0).toLocaleString('en-IN')} sq ft`, label: 'Carpet area' },
              { icon: Compass, value: specifications?.facing || 'East', label: 'Facing' },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="p-5 flex items-center gap-3">
                <Icon size={20} className="text-ink-400 flex-shrink-0" />
                <div>
                  <div className="text-lg font-bold text-ink-900 tabular">{value}</div>
                  <div className="text-xs text-ink-500">{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="glass-card p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">About this Property</h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {property.description || 'This property offers modern living spaces, high-end finishing, and convenient connectivity to financial districts and tech hubs.'}
            </p>
          </div>

          {/* Amenities Grid */}
          <div className="glass-card p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Property Amenities</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(amenities || ['Lift', 'Gym', 'Parking', 'Security', 'Clubhouse']).map((amenity, i) => (
                <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-800">
                  <Check size={15} className="text-moss-600 flex-shrink-0" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* LARGE EXPONSIVE INTERACTIVE MAP SECTION */}
          <div className="glass-card p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-ink-900">Location and neighbourhood</h3>
                <p className="text-sm text-ink-500">Schools, hospitals, transit and what's around the property.</p>
              </div>
              <span className="badge-success">GPS verified</span>
            </div>

            <PropertyMapView 
              properties={[property]} 
              customPois={activePois}
              activePoiCategory={poiCategory}
              heightClass="h-[480px]" 
            />
          </div>
        </div>

        {/* Right Column: AI Assistant & Contact Seller */}
        <div className="lg:col-span-4 space-y-6">
          {/* Seller Card */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-ink-100 text-ink-800 flex items-center justify-center font-bold text-lg">
                {seller?.name?.charAt(0) || 'S'}
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink-900">{seller?.name || 'Verified Developer'}</h4>
                <p className="text-xs text-ink-500">Listed by</p>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-line mb-5 text-sm text-ink-700">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-ink-400" /> {seller?.email || 'contact@smartsite.com'}
              </div>
              <div className="flex items-center gap-2 tabular">
                <Phone size={14} className="text-ink-400" /> {seller?.phone || '+91 98765 43210'}
              </div>
            </div>

            <button
              onClick={() => alert(`Inquiry sent to ${seller?.name || 'Seller'}! They will reach out shortly.`)}
              className="btn-primary w-full !py-3 text-sm gap-2 mb-2"
            >
              <Phone size={15} /> Request a callback
            </button>

            <button
              onClick={() => (isAuthenticated ? setIsNegotiationOpen(true) : navigate('/login'))}
              title={isAuthenticated ? undefined : 'Sign in to get negotiation advice'}
              className="btn-secondary w-full !py-2.5 text-sm gap-2 mb-2"
            >
              <Handshake size={15} /> Negotiation advice
            </button>

            <button
              onClick={() => setIsReportOpen(true)}
              className="btn-secondary w-full !py-2.5 text-sm gap-2"
            >
              <FileText size={15} /> Full property report
            </button>
          </div>

          {/* Score breakdown */}
          <div className="glass-card p-6">
            <h4 className="text-sm font-bold text-ink-900 mb-4">Score breakdown</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">ROI Potential Score</span>
                <span className="font-bold text-moss-600">
                  {aiScore?.roiPotential != null ? `${aiScore.roiPotential} / 100` : 'Not yet scored'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Transit Connectivity</span>
                <span className="font-bold text-slate-800">
                  {aiScore?.connectivityScore != null ? `${aiScore.connectivityScore} / 100` : 'Not yet scored'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Environmental Health</span>
                <span className="font-bold text-slate-800">
                  {environmentScore?.overall != null ? `${environmentScore.overall} / 100` : 'Not yet scored'}
                </span>
              </div>
              {priceFairness && (
                <div className="text-xs">
                  <div className="text-slate-500 font-medium mb-0.5">Price vs. Nearby Listings</div>
                  <div className={`font-bold ${fairnessColor || 'text-slate-600'}`}>{priceFairness.message}</div>
                </div>
              )}
            </div>
          </div>

          {/* Explainer AI Bot */}
          <ExplainerChatbot 
            property={property} 
            color="#a8432a"
            onPoiUpdate={(pois, category) => {
              setActivePois(pois);
              setPoiCategory(category);
            }}
          />
        </div>
      </div>

      {/* Negotiation Deal Advisor Modal */}
      <NegotiationAdvisorModal
        isOpen={isNegotiationOpen}
        onClose={() => setIsNegotiationOpen(false)}
        property={property}
      />

      {/* AI Investment Report Modal */}
      <PropertyReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        property={property}
      />
    </div>
  );
}
