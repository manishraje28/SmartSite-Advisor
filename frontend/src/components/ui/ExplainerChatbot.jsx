import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { buyerAPI } from '../../services/api';
import { Sparkles, Send, MapPin, Loader2, Bot } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '16px'
};

const defaultCenter = {
  lat: 19.0760,
  lng: 72.8777
};

export default function ExplainerChatbot({ property, color }) {
  const [messages, setMessages] = useState([
    { text: `Hi! I'm your AI location expert. Ask me about the neighborhood for **${property.title}** (e.g. "Any hospitals within 5km?")`, sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mapNodes, setMapNodes] = useState([]);
  const messagesEndRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  });

  const propertyCenter = {
    lat: property.location?.coordinates?.[1] || defaultCenter.lat,
    lng: property.location?.coordinates?.[0] || defaultCenter.lng
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
    setInput('');
    setLoading(true);

    // Extract radius if user types "X km" -> default to 10km if not specifying
    let radius = 10000;
    const kmMatch = userMessage.toLowerCase().match(/(\d+)\s*(km|kms|kilometers)/);
    if (kmMatch) {
      radius = parseInt(kmMatch[1]) * 1000;
    }

    try {
      const res = await buyerAPI.explainComparison({
        message: userMessage,
        propertyId: property._id,
        radius
      });
      
      const { reply, rawAmenities } = res.data.data;
      
      // Update UI with bot reply
      setMessages(prev => [...prev, { text: reply, sender: 'bot' }]);
      
      // Plot amenities
      if (rawAmenities) {
        const nodes = [];
        Object.entries(rawAmenities).forEach(([type, data]) => {
          data.top.forEach((amenity) => {
            nodes.push({
              id: `${type}-${amenity.name}`,
              type,
              name: amenity.name,
              lat: amenity.location.lat,
              lng: amenity.location.lng
            });
          });
        });
        setMapNodes(nodes);
      }
    } catch (err) {
      setMessages(prev => [...prev, { text: "Sorry, I had trouble reaching the AI. Let me try again later.", sender: 'bot' }]);
    }
    
    setLoading(false);
  };

  return (
    <div className="glass-card mt-6 p-1 rounded-2xl flex flex-col md:flex-row gap-4 border" style={{ borderColor: `${color}40` }}>
      
      {/* Map Section */}
      <div className="flex-1 rounded-xl overflow-hidden relative">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={propertyCenter}
            zoom={13}
            options={{
              disableDefaultUI: true,
              zoomControl: true,
              styles: [
                { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
                { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
                { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
                {
                  featureType: 'water',
                  elementType: 'geometry',
                  stylers: [{ color: '#17263c' }]
                }
              ]
            }}
          >
            {/* Property Marker */}
            <Marker 
              position={propertyCenter}
              icon={{
                url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
              }}
              label={{ text: "🏡", color: 'white' }}
            />
            {/* Amenities Markers */}
            {mapNodes.map((node) => (
              <Marker
                key={node.id}
                position={{ lat: node.lat, lng: node.lng }}
                icon={{
                  url: `http://maps.google.com/mapfiles/ms/icons/${node.type === 'schools' ? 'blue' : node.type === 'hospitals' ? 'red' : 'yellow'}-dot.png`
                }}
                title={node.name}
              />
            ))}
          </GoogleMap>
        ) : (
          <div className="w-full h-[400px] flex items-center justify-center bg-surface-container/50">
            <Loader2 className="animate-spin text-primary" />
          </div>
        )}

        <div className="absolute top-4 left-4 right-4 flex gap-2 pointer-events-none">
           <div className="bg-surface/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider pointer-events-auto">
             🏡 Property
           </div>
           {mapNodes.length > 0 && (
             <div className="bg-primary/20 backdrop-blur-md border border-primary/30 text-primary px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider shadow-glow-primary pointer-events-auto">
               📍 Plotted {mapNodes.length} top amenities
             </div>
           )}
        </div>
      </div>

      {/* Chat Section */}
      <div className="w-full md:w-[350px] lg:w-[400px] flex flex-col h-[400px] rounded-xl overflow-hidden bg-surface-container">
        
        {/* Chat Header */}
        <div className="h-14 border-b border-white/5 flex items-center px-4 bg-white/5">
          <Bot size={18} style={{ color }} className="mr-2" />
          <h3 className="font-semibold text-sm">AI Neighborhood Expert</h3>
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
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                  msg.sender === 'user' 
                  ? 'bg-indigo-500 text-white rounded-br-sm' 
                  : 'bg-white/10 text-on-surface rounded-bl-sm'
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
               <div className="bg-white/10 rounded-2xl rounded-bl-sm p-3 flex gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                 <div className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                 <div className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: '300ms' }} />
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-white/5 border-t border-white/5">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Find schools within 10km..."
              className="w-full bg-surface-container-highest border border-white/10 rounded-full py-2.5 pl-4 pr-10 text-xs text-on-surface focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
            <button 
              type="submit" 
              disabled={!input.trim() || loading}
              className="absolute right-2 w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-400 transition-colors"
            >
              <Send size={12} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}