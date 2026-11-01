import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, MessageCircle, X, RefreshCw } from 'lucide-react';
import { agentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function ParichayVoiceAssistant() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [result, setResult] = useState(null);

  // The assistant runs on the LLM agent routes, which require sign-in.
  if (!isAuthenticated) return null;

  // Web Speech API Voice Recognition (if supported in browser)
  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice recognition is not supported in your browser. Please type your query.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      submitQuery(transcript);
    };

    recognition.start();
  };

  const submitQuery = async (textToSubmit) => {
    const activeText = textToSubmit || query;
    if (!activeText.trim()) return;

    setLoading(true);
    try {
      const response = await agentAPI.profileBuyer({
        query: activeText
      });
      if (response.data?.success) {
        setResult(response.data.data);
      }
    } catch (err) {
      console.error("Parichay Voice Assistant Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating launch button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Ask SmartSite"
          className="w-14 h-14 rounded-full bg-ink-900 text-white hover:bg-ink-800 shadow-lg flex items-center justify-center transition-colors"
        >
          <MessageCircle size={22} />
        </button>
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-ink-900 text-white rounded-lg p-5 border border-ink-800 shadow-lg"
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-ink-800 mb-4">
              <div>
                <h4 className="text-sm font-bold text-white">Ask SmartSite</h4>
                <p className="text-xs text-ink-200">Describe the home you want, by text or voice.</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close"
                className="p-1.5 rounded-md hover:bg-ink-800 text-ink-200 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Input form */}
            <div className="space-y-3 mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitQuery()}
                  placeholder="e.g. 3 BHK near metro under 1 Cr"
                  className="w-full bg-ink-950 text-white placeholder-ink-400 text-sm rounded-md py-2.5 pl-3 pr-20 border border-ink-700 focus:outline-none focus:border-ink-300"
                />
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    onClick={handleVoiceInput}
                    type="button"
                    aria-label={isListening ? 'Listening' : 'Speak your query'}
                    className={`p-1.5 rounded-md transition-colors ${
                      isListening ? 'bg-brick-600 text-white' : 'text-ink-200 hover:text-white hover:bg-ink-800'
                    }`}
                  >
                    <Mic size={14} />
                  </button>
                  <button
                    onClick={() => submitQuery()}
                    type="button"
                    disabled={loading}
                    aria-label="Send"
                    className="p-1.5 rounded-md bg-brick-600 text-white hover:bg-brick-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Result Display */}
            {result && (
              <div className="bg-ink-950 p-4 rounded-lg border border-ink-800 text-xs space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-white">{result.personaCategory}</span>
                  <span className="text-ink-200 tabular">Budget: {result.suggestedBudget}</span>
                </div>

                <p className="text-ink-200 leading-relaxed">{result.plainEnglishSummary}</p>

                <dl className="grid grid-cols-4 gap-px bg-ink-800 border border-ink-800 rounded text-center tabular">
                  <div className="bg-ink-950 p-1.5"><dt className="text-ink-300">ROI</dt><dd className="font-semibold text-white">{result.roiWeight}%</dd></div>
                  <div className="bg-ink-950 p-1.5"><dt className="text-ink-300">Transit</dt><dd className="font-semibold text-white">{result.transitWeight}%</dd></div>
                  <div className="bg-ink-950 p-1.5"><dt className="text-ink-300">Amenities</dt><dd className="font-semibold text-white">{result.amenitiesWeight}%</dd></div>
                  <div className="bg-ink-950 p-1.5"><dt className="text-ink-300">Eco</dt><dd className="font-semibold text-white">{result.ecoHealthWeight}%</dd></div>
                </dl>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
