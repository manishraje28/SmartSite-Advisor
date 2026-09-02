import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send, MapPin, Loader2, Bot, Compass } from 'lucide-react';
import PropertyMapView from '../property/PropertyMapView';
import { buyerAPI } from '../../services/api';

// Maps a user's question to which of the backend's real Google Places categories
// to plot on the map. Backend always fetches all 5 (schools/hospitals/parks/
// transit/supermarkets) per request, so this only decides what's shown, not what's
// fetched — asking a follow-up about a different category is still instant.
const CATEGORY_KEYWORDS = [
  { key: 'schools', label: 'Schools & Colleges', match: ['school', 'college', 'education', 'university'] },
  { key: 'hospitals', label: 'Hospitals & Healthcare', match: ['hospital', 'doctor', 'clinic', 'health', 'icu'] },
  { key: 'supermarkets', label: 'Shopping & Malls', match: ['mall', 'shopping', 'market', 'store', 'supermarket', 'grocery'] },
  { key: 'transit', label: 'Metro & Transit', match: ['metro', 'station', 'train', 'transit', 'bus'] },
  { key: 'parks', label: 'Parks & Green Spaces', match: ['park', 'garden', 'green'] },
];

const BACKEND_CATEGORY_TO_PIN = {
  schools: 'school',
  hospitals: 'hospital',
  parks: 'park',
  transit: 'metro',
  supermarkets: 'supermarket',
};

function detectCategory(question) {
  const q = question.toLowerCase();
  return CATEGORY_KEYWORDS.find(({ match }) => match.some((kw) => q.includes(kw))) || null;
}

export default function ExplainerChatbot({ property, color = '#6366f1', onPoiUpdate }) {
  const [messages, setMessages] = useState([
    {
      text: `Hi! I'm your AI location expert for **${property?.title || 'this property'}**. Ask me about nearby amenities (e.g., "Are there malls nearby?", "Where are the nearest schools?", "Show metro stations") — I'll find the real nearest ones for this exact property.`,
      sender: 'bot'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pois, setPois] = useState([]);
  const [poiCategory, setPoiCategory] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !property?._id) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { text: userMessage, sender: 'user' }]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await buyerAPI.explainComparison({
        message: userMessage,
        propertyId: property._id,
        radius: 5000,
      });

      if (!data?.success) throw new Error('Request failed');

      const rawAmenities = data.data.rawAmenities || {};
      const matched = detectCategory(userMessage);

      let newPois = [];
      let catName = null;

      if (matched && rawAmenities[matched.key]?.top?.length) {
        catName = matched.label;
        newPois = rawAmenities[matched.key].top.map((item) => ({
          name: item.name,
          category: BACKEND_CATEGORY_TO_PIN[matched.key],
          lat: item.location?.lat,
          lng: item.location?.lng,
          distance: item.distanceText || 'nearby',
        }));
      } else {
        // No specific category asked (or nothing found for it) — show the single
        // nearest result from each category as a general neighborhood snapshot.
        catName = 'Neighborhood Highlights';
        Object.entries(rawAmenities).forEach(([key, data2]) => {
          const nearest = data2?.top?.[0];
          if (nearest) {
            newPois.push({
              name: nearest.name,
              category: BACKEND_CATEGORY_TO_PIN[key],
              lat: nearest.location?.lat,
              lng: nearest.location?.lng,
              distance: nearest.distanceText || 'nearby',
            });
          }
        });
      }

      newPois = newPois.filter((p) => typeof p.lat === 'number' && typeof p.lng === 'number');

      setPois(newPois);
      setPoiCategory(catName);
      if (onPoiUpdate) onPoiUpdate(newPois, catName);

      setMessages((prev) => [...prev, { text: data.data.reply, sender: 'bot' }]);
    } catch (err) {
      console.error('Explainer chat failed:', err);
      setMessages((prev) => [...prev, { text: "Sorry, I couldn't fetch nearby data just now. Please try again.", sender: 'bot' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card mt-6 p-4 rounded-3xl flex flex-col gap-6 border border-slate-200">

      {/* Dynamic Map Section — full width so every pinned POI is fully visible */}
      <div className="w-full rounded-2xl overflow-hidden relative border border-slate-200">
        <PropertyMapView
          properties={[property]}
          customPois={pois}
          activePoiCategory={poiCategory}
          heightClass="h-[420px]"
        />
      </div>

      {/* Chat Section */}
      <div className="w-full flex flex-col h-[380px] rounded-2xl overflow-hidden bg-slate-900 text-white shadow-xl">

        {/* Chat Header */}
        <div className="h-14 border-b border-slate-800 flex items-center px-4 bg-slate-950/80">
          <Bot size={20} className="text-indigo-400 mr-2" />
          <div>
            <h3 className="font-bold text-sm text-white">AI Spatial Expert</h3>
            <p className="text-[10px] text-indigo-300">Real nearest amenities via Google Places, for this property</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 relative no-scrollbar">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl p-3 text-xs leading-relaxed ${
                  msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-sm shadow-md font-medium'
                  : 'bg-slate-800 text-slate-200 rounded-bl-sm border border-slate-700/60'
                }`}
              >
                {msg.text.split('\n').map((line, idx) => (
                  <React.Fragment key={idx}>
                    {line}
                    {idx !== msg.text.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>
            </motion.div>
          ))}
          {loading && (
             <div className="flex justify-start">
               <div className="bg-slate-800 rounded-2xl rounded-bl-sm p-3 flex gap-1 items-center text-xs text-indigo-300">
                 <Loader2 size={14} className="animate-spin text-indigo-400" /> Finding nearest real amenities...
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-slate-950/90 border-t border-slate-800">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Are there malls or schools nearby?"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-full py-2.5 pl-4 pr-10 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2 w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-500 transition-colors shadow-md"
            >
              <Send size={12} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
