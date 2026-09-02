import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleMap, OverlayView, OverlayViewF, InfoWindowF, useJsApiLoader } from '@react-google-maps/api';
import { MapPin, Sparkles, CloudSun, Compass, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Comprehensive Micro-Locality Coordinates Lookup Table for MMR (Mumbai, Thane, Navi Mumbai)
// Used as a fallback only when a property genuinely has no usable coordinates.
const LOCALITY_COORDINATES = {
  // South & Central Mumbai
  'lower parel': [18.9950, 72.8280],
  'worli': [19.0176, 72.8172],
  'mahalaxmi': [18.9827, 72.8250],
  'dadar': [19.0178, 72.8478],
  'prabhadevi': [19.0160, 72.8280],
  'colaba': [18.9067, 72.8147],
  'nariman point': [18.9260, 72.8228],

  // Western Suburbs
  'bandra west': [19.0596, 72.8295],
  'bandra east': [19.0625, 72.8512],
  'bandra': [19.0596, 72.8295],
  'bkc': [19.0657, 72.8687],
  'bandra kurla complex': [19.0657, 72.8687],
  'khar': [19.0697, 72.8335],
  'santacruz': [19.0843, 72.8360],
  'santa cruz': [19.0843, 72.8360],
  'juhu': [19.1075, 72.8263],
  'andheri east': [19.1136, 72.8697],
  'andheri west': [19.1363, 72.8277],
  'andheri': [19.1136, 72.8697],
  'lokhandwala': [19.1415, 72.8235],
  'goregaon east': [19.1663, 72.8526],
  'goregaon west': [19.1680, 72.8390],
  'goregaon': [19.1663, 72.8526],
  'malad west': [19.1860, 72.8485],
  'malad east': [19.1840, 72.8600],
  'malad': [19.1860, 72.8485],
  'kandivali': [19.2045, 72.8522],
  'borivali east': [19.2288, 72.8541],
  'borivali west': [19.2310, 72.8470],
  'borivali': [19.2288, 72.8541],
  'dahisar': [19.2570, 72.8590],

  // Central Suburbs
  'powai': [19.1176, 72.9060],
  'hiranandani': [19.1176, 72.9060],
  'chembur': [19.0623, 72.8997],
  'ghatkopar': [19.0860, 72.9080],
  'vikhroli': [19.1000, 72.9200],
  'kanjurmarg': [19.1300, 72.9300],
  'bhandup': [19.1500, 72.9400],
  'mulund': [19.1726, 72.9565],

  // Thane
  'ghodbunder road': [19.2650, 72.9640],
  'ghodbunder': [19.2650, 72.9640],
  'majiwada': [19.2190, 72.9860],
  'kapurbawdi': [19.2290, 72.9810],
  'vartak nagar': [19.2100, 72.9650],
  'thane west': [19.2183, 72.9781],
  'thane east': [19.1870, 72.9720],
  'thane': [19.2183, 72.9781],

  // Navi Mumbai
  'vashi': [19.0770, 72.9980],
  'sanpada': [19.0640, 73.0080],
  'nerul': [19.0330, 73.0180],
  'seawoods': [19.0108, 73.0169],
  'cbd belapur': [19.0200, 73.0400],
  'belapur': [19.0200, 73.0400],
  'kharghar': [19.0473, 73.0699],
  'kamothe': [19.0260, 73.0950],
  'panvel': [18.9894, 73.1175],
  'airoli': [19.1570, 72.9980],
  'ghansoli': [19.1250, 73.0000],
  'kopar khairane': [19.1020, 73.0070],
};

function getAccurateCoordinates(prop, index = 0) {
  const coords = prop.location?.coordinates;
  const hasCoords = Array.isArray(coords) && coords.length === 2 && coords[0] !== 0 && coords[1] !== 0;

  let lat = null;
  let lng = null;

  if (hasCoords) {
    const isGenericCenter = Math.abs(coords[0] - 72.8777) < 0.005 && Math.abs(coords[1] - 19.0760) < 0.005;
    if (!isGenericCenter) {
      lng = coords[0];
      lat = coords[1];
    }
  }

  if (!lat || !lng) {
    const textToMatch = `${prop.title || ''} ${prop.location?.address || ''} ${prop.location?.city || ''} ${prop.locality || ''} ${prop.description || ''}`.toLowerCase();

    for (const [locality, locCoords] of Object.entries(LOCALITY_COORDINATES)) {
      if (textToMatch.includes(locality)) {
        lat = locCoords[0];
        lng = locCoords[1];
        break;
      }
    }
  }

  if (!lat || !lng) {
    const city = prop.location?.city?.toLowerCase() || '';
    if (city.includes('thane')) {
      lat = 19.2183; lng = 72.9781;
    } else if (city.includes('navi mumbai')) {
      lat = 19.0330; lng = 73.0297;
    } else {
      lat = 19.0760; lng = 72.8777;
    }
  }

  const idStr = prop._id || prop.id || prop.title || `${index}`;
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash << 5) - hash + idStr.charCodeAt(i);
    hash |= 0;
  }
  const jitterLat = (((Math.abs(hash) % 100) / 100) - 0.5) * 0.003;
  const jitterLng = (((Math.abs(hash >> 2) % 100) / 100) - 0.5) * 0.003;

  return { lat: lat + jitterLat, lng: lng + jitterLng };
}

// Price-bubble marker with a real pointed tip beneath it, pointing at the exact
// coordinate — rendered as plain React inside a Google Maps OverlayView (rather
// than a Leaflet divIcon HTML string), so it's just normal JSX.
function PropertyPin({ price, verified, isHighlighted, onClick }) {
  const priceLabel = price >= 10000000
    ? `₹${(price / 10000000).toFixed(1)}Cr`
    : price >= 100000
    ? `₹${(price / 100000).toFixed(0)}L`
    : `₹${price}`;

  const pinColor = isHighlighted ? '#fbbf24' : verified ? '#10b981' : '#6366f1';

  return (
    <div
      onClick={onClick}
      style={{
        transform: 'translate(-50%, -100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        zIndex: isHighlighted ? 999 : 50,
      }}
    >
      <div
        style={{
          background: isHighlighted ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : verified ? '#0f172a' : '#1e293b',
          color: '#ffffff',
          padding: isHighlighted ? '8px 14px' : '6px 10px',
          borderRadius: 24,
          fontWeight: 800,
          fontSize: isHighlighted ? 13 : 11,
          border: `2px solid ${pinColor}`,
          boxShadow: isHighlighted ? '0 0 20px rgba(124, 58, 237, 0.6), 0 4px 14px rgba(0,0,0,0.4)' : '0 4px 14px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          whiteSpace: 'nowrap',
        }}
      >
        {isHighlighted ? (
          <span style={{ fontSize: 12 }}>✨</span>
        ) : (
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: pinColor }} />
        )}
        {priceLabel}
      </div>
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: '7px solid transparent',
          borderRight: '7px solid transparent',
          borderTop: `11px solid ${pinColor}`,
          marginTop: -1,
          filter: 'drop-shadow(0 2px 1px rgba(0,0,0,0.3))',
        }}
      />
    </div>
  );
}

const POI_STYLES = {
  school: { emoji: '🏫', color: '#ec4899' },
  hospital: { emoji: '🏥', color: '#ef4444' },
  metro: { emoji: '🚇', color: '#3b82f6' },
  park: { emoji: '🌳', color: '#10b981' },
  mall: { emoji: '🛍️', color: '#f59e0b' },
  supermarket: { emoji: '🛒', color: '#f59e0b' },
};

function PoiPin({ category, name, onClick }) {
  const { emoji, color } = POI_STYLES[category] || { emoji: '📍', color: '#10b981' };

  return (
    <div
      onClick={onClick}
      style={{
        transform: 'translate(-50%, -100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          background: '#0f172a',
          color: '#ffffff',
          padding: '5px 10px',
          borderRadius: 16,
          fontWeight: 700,
          fontSize: 11,
          border: `2px solid ${color}`,
          boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          whiteSpace: 'nowrap',
        }}
      >
        <span>{emoji}</span>
        <span>{name}</span>
      </div>
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: `9px solid ${color}`,
          marginTop: -1,
          filter: 'drop-shadow(0 2px 1px rgba(0,0,0,0.3))',
        }}
      />
    </div>
  );
}

const containerStyle = { width: '100%', height: '100%' };
const MAP_OPTIONS = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
};

export default function PropertyMapView({
  properties,
  onSelectProperty,
  onOpenReport,
  heightClass = "h-[700px]",
  highlightedPropertyIds = [],
  customPois = [],
  activePoiCategory = null
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'smartsite-google-maps-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  const [mapRef, setMapRef] = useState(null);
  const [activeMarkerKey, setActiveMarkerKey] = useState(null);
  const [activePoiIdx, setActivePoiIdx] = useState(null);

  const propertyList = properties || [];

  const mappedProperties = useMemo(
    () => propertyList.map((p, i) => ({ property: p, position: getAccurateCoordinates(p, i) })),
    [propertyList]
  );

  const isSingleProperty = mappedProperties.length === 1;
  const defaultCenter = isSingleProperty ? mappedProperties[0].position : { lat: 19.0760, lng: 72.8777 };
  const defaultZoom = isSingleProperty ? 14 : 11;

  const onLoad = useCallback((map) => setMapRef(map), []);
  const onUnmount = useCallback(() => setMapRef(null), []);

  // Recenter when the target property/region changes (e.g. switching properties).
  useEffect(() => {
    if (mapRef) mapRef.panTo(defaultCenter);
  }, [mapRef, defaultCenter.lat, defaultCenter.lng]);

  // Fit the viewport to include the property + every pinned POI, so nothing the
  // chatbot plots falls outside the visible map.
  useEffect(() => {
    if (!mapRef || !isSingleProperty || customPois.length === 0 || !window.google) return;
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(defaultCenter);
    customPois.forEach((poi) => bounds.extend({ lat: poi.lat, lng: poi.lng }));
    mapRef.fitBounds(bounds, 60);
  }, [mapRef, isSingleProperty, customPois, defaultCenter.lat, defaultCenter.lng]);

  const formatPrice = (p) => {
    if (!p) return 'Price on Request';
    if (p >= 10000000) return `₹${(p / 10000000).toFixed(2)} Cr`;
    if (p >= 100000) return `₹${(p / 100000).toFixed(2)} L`;
    return `₹${p}`;
  };

  if (!GOOGLE_MAPS_API_KEY || loadError) {
    return (
      <div className={`relative w-full ${heightClass} rounded-3xl overflow-hidden border border-slate-200 shadow-soft flex items-center justify-center bg-slate-50`}>
        <div className="text-center p-6">
          <AlertTriangle className="mx-auto mb-2 text-amber-500" size={28} />
          <p className="text-sm font-semibold text-slate-700">Map failed to load</p>
          <p className="text-xs text-slate-500 mt-1">Check VITE_GOOGLE_MAPS_API_KEY in frontend/.env</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`relative w-full ${heightClass} rounded-3xl overflow-hidden border border-slate-200 shadow-soft flex items-center justify-center bg-slate-50`}>
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`relative w-full ${heightClass} rounded-3xl overflow-hidden border border-slate-200 shadow-soft z-0`}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={defaultZoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={MAP_OPTIONS}
      >
        {/* Property Markers */}
        {mappedProperties.map(({ property: prop, position }, i) => {
          const key = prop._id || prop.id || `prop-${i}`;
          const isHighlighted = highlightedPropertyIds.includes(prop._id || prop.id);

          return (
            <OverlayViewF key={key} position={position} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
              <PropertyPin
                price={prop.price}
                verified={prop.verifiedLive}
                isHighlighted={isHighlighted}
                onClick={() => setActiveMarkerKey(activeMarkerKey === key ? null : key)}
              />
            </OverlayViewF>
          );
        })}

        {mappedProperties.map(({ property: prop, position }, i) => {
          const key = prop._id || prop.id || `prop-${i}`;
          if (activeMarkerKey !== key) return null;

          return (
            <InfoWindowF
              key={`info-${key}`}
              position={position}
              onCloseClick={() => setActiveMarkerKey(null)}
              options={{ pixelOffset: new window.google.maps.Size(0, -52) }}
            >
              <div className="w-64 p-1">
                <img
                  src={prop.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80'}
                  alt={prop.title}
                  className="w-full h-28 object-cover rounded-xl mb-2"
                />
                <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 uppercase mb-1">
                  <Sparkles size={12} /> {prop.aiScore?.overall != null ? `${prop.aiScore.overall}% AI Match` : 'Not yet scored'}
                </div>
                <h4 className="font-bold text-slate-900 text-sm truncate mb-1">{prop.title}</h4>
                <p className="text-slate-500 text-xs truncate mb-2">{prop.location?.address || prop.location?.city}</p>

                <div className="flex items-center justify-between border-t border-slate-100 pt-2 mb-2">
                  <span className="font-extrabold text-slate-900 text-sm">{formatPrice(prop.price)}</span>
                  {prop.environmentScore?.aqi != null && (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <CloudSun size={12} /> AQI {prop.environmentScore.aqi}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/property/${prop._id}`}
                    className="flex-1 py-1.5 px-2 bg-slate-900 text-white rounded-lg text-xs font-semibold text-center hover:bg-slate-800 transition-colors"
                  >
                    View Details
                  </Link>
                  {onOpenReport && (
                    <button
                      onClick={() => onOpenReport(prop)}
                      className="py-1.5 px-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition-colors"
                    >
                      AI Report
                    </button>
                  )}
                </div>
              </div>
            </InfoWindowF>
          );
        })}

        {/* Dynamic Nearby POI Markers */}
        {customPois.map((poi, idx) => (
          <OverlayViewF key={`poi-${idx}`} position={{ lat: poi.lat, lng: poi.lng }} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
            <PoiPin category={poi.category} name={poi.name} onClick={() => setActivePoiIdx(activePoiIdx === idx ? null : idx)} />
          </OverlayViewF>
        ))}

        {customPois.map((poi, idx) => {
          if (activePoiIdx !== idx) return null;
          return (
            <InfoWindowF
              key={`poi-info-${idx}`}
              position={{ lat: poi.lat, lng: poi.lng }}
              onCloseClick={() => setActivePoiIdx(null)}
              options={{ pixelOffset: new window.google.maps.Size(0, -42) }}
            >
              <div className="p-2 text-center">
                <h5 className="font-bold text-slate-900 text-xs">{poi.name}</h5>
                <p className="text-[11px] text-indigo-600 font-semibold mt-1">📍 {poi.distance} from property</p>
              </div>
            </InfoWindowF>
          );
        })}
      </GoogleMap>

      {/* Floating Info & Active Filter Badges */}
      <div className="absolute top-4 right-4 z-[100] flex flex-col items-end gap-2 pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-full border border-white/20 shadow-lg flex items-center gap-2 pointer-events-auto">
          <MapPin size={14} className="text-emerald-400" />
          {isSingleProperty ? 'Neighborhood & Spatial View' : `Showing ${mappedProperties.length} Regional Properties`}
        </div>

        {activePoiCategory && (
          <div className="bg-amber-500/90 backdrop-blur-md text-slate-950 text-xs font-extrabold px-4 py-2 rounded-full border border-amber-300 shadow-xl flex items-center gap-2 pointer-events-auto">
            <Compass size={14} className="text-slate-950" />
            Showing POIs: {activePoiCategory} ({customPois.length} Found)
          </div>
        )}

        {highlightedPropertyIds.length > 0 && (
          <div className="bg-indigo-600/95 backdrop-blur-md text-white text-xs font-extrabold px-4 py-2 rounded-full border border-indigo-400 shadow-xl flex items-center gap-2 pointer-events-auto">
            <Sparkles size={14} className="text-amber-300" />
            ✨ {highlightedPropertyIds.length} Properties Matched Your Natural Language Query!
          </div>
        )}
      </div>
    </div>
  );
}
