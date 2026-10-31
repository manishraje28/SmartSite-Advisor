import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, MessageSquare } from 'lucide-react';
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

export default function ExplainerChatbot({ property, color = '#a8432a', onPoiUpdate }) {
  const [messages, setMessages] = useState([
    {
      text: `Hi! Ask me about ${property?.title || 'this property'}: nearby amenities (e.g., "Are there malls nearby?") or its score (e.g., "Why is the score 84?", "Why is this suitable for a family?") — I'll answer from this property's real data.`,
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
      const text = err.response?.status === 401
        ? 'Please sign in to ask questions about this home.'
        : "Sorry, I couldn't fetch nearby data just now. Please try again.";
      setMessages((prev) => [...prev, { text, sender: 'bot' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card mt-6 p-4 flex flex-col gap-4">

      {/* Dynamic Map Section — full width so every pinned POI is fully visible */}
      <div className="w-full rounded-lg overflow-hidden relative border border-line">
        <PropertyMapView
          properties={[property]}
          customPois={pois}
          activePoiCategory={poiCategory}
          heightClass="h-[420px]"
        />
      </div>

      {/* Chat Section */}
      <div className="w-full flex flex-col h-[380px] rounded-lg overflow-hidden bg-ink-900 text-white border border-ink-800">

        {/* Chat Header */}
        <div className="h-14 border-b border-ink-800 flex items-center px-4">
          <MessageSquare size={18} className="text-ink-200 mr-2.5" />
          <div>
            <h3 className="font-bold text-sm text-white">Ask about this home</h3>
            <p className="text-xs text-ink-200">Nearby amenities and how the score was worked out</p>
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
                className={`max-w-[90%] rounded-lg p-3 text-sm leading-relaxed ${
                  msg.sender === 'user'
                  ? 'text-white'
                  : 'bg-ink-800 text-ink-100'
                }`}
                style={msg.sender === 'user' ? { backgroundColor: color } : undefined}
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
               <div className="bg-ink-800 rounded-lg p-3 flex gap-1.5 items-center text-sm text-ink-200">
                 <Loader2 size={14} className="animate-spin" /> Finding the nearest amenities...
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-ink-800">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Are there malls or schools nearby?"
              className="w-full bg-ink-950 border border-ink-700 rounded-md py-2.5 pl-3 pr-11 text-sm text-white placeholder:text-ink-400 focus:outline-none focus:border-ink-300 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-1.5 w-8 h-8 rounded flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              style={{ backgroundColor: color }}
              aria-label="Send"
            >
              <Send size={14} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
