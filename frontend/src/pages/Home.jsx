import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  TrendingUp, 
  Map, 
  ShieldCheck, 
  LineChart, 
  Brain, 
  Building2,
  Users
} from 'lucide-react';

const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, 
    y: 0,
    transition: { 
      delay: i * 0.1, 
      duration: 0.6, 
      ease: [0.22, 1, 0.36, 1] 
    },
  }),
};

export default function Home() {
  return (
    <div className="w-full">
      {/* ── HERO SECTION ── */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 inset-x-0 h-full overflow-hidden -z-10">
          <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-ai-indigo/10 blur-[120px] mix-blend-multiply pointer-events-none animate-float" />
          <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-ai-emerald/10 blur-[120px] mix-blend-multiply pointer-events-none animate-float" style={{ animationDelay: '2s' }} />
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div 
              custom={0} 
              initial="hidden" 
              animate="visible" 
              variants={fadeUpVariants}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ai-indigo/5 border border-ai-indigo/10 mb-8"
            >
              <Sparkles size={16} className="text-ai-indigo" />
              <span className="text-sm font-medium text-slate-700">The First AI Ecosystem for Real Estate</span>
            </motion.div>

            <motion.h1 
              custom={1} 
              initial="hidden" 
              animate="visible" 
              variants={fadeUpVariants}
              className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-8"
            >
              Make <span className="ai-gradient-text">Intelligent</span> Decisions.
              <br className="hidden md:block"/> Not Just Guesses.
            </motion.h1>

            <motion.p 
              custom={2} 
              initial="hidden" 
              animate="visible" 
              variants={fadeUpVariants}
              className="text-lg md:text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              SmartSite uses multi-agent AI to score ROI, Amenities, and Location. 
              We match buyers to properties that fit their lifestyle, and help sellers maximize market value.
            </motion.p>

            <motion.div 
              custom={3} 
              initial="hidden" 
              animate="visible" 
              variants={fadeUpVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                <Link 
                  to="/register?role=buyer" 
                  className="flex items-center justify-center gap-2 w-full px-8 py-4 bg-slate-900 text-white rounded-full font-semibold shadow-xl shadow-slate-900/20 hover:shadow-slate-900/40 transition-all"
                >
                  <Sparkles size={18} /> Find My Match
                </Link>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                <Link 
                  to="/register?role=seller" 
                  className="flex items-center justify-center gap-2 w-full px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-full font-semibold shadow-sm hover:shadow-md transition-all hover:bg-slate-50"
                >
                  <Building2 size={18} className="text-slate-500" /> List & Score Property
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── BENTO GRID SECTION ── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">The Construction Intelligence Ecosystem</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">A dual-sided platform bringing absolute transparency and predictive accuracy to both buyers and constructors.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Bento Box 1: Large (Span 2) */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeUpVariants}
              custom={0}
              className="md:col-span-2 glass-card p-8 md:p-12 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                <Brain size={120} className="text-ai-indigo" />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-ai-indigo/10 rounded-2xl flex items-center justify-center mb-6">
                  <Users size={24} className="text-ai-indigo" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">AI Matchmaking for Buyers</h3>
                <p className="text-slate-600 max-w-md leading-relaxed">
                  Input your custom lifestyle weights (e.g., 50% ROI, 30% Amenities). 
                  Our algorithm grades every property against your priorities, giving you a 
                  <span className="font-semibold text-ai-indigo"> Personalized Match %</span>.
                </p>
              </div>
            </motion.div>

            {/* Bento Box 2: Square */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeUpVariants}
              custom={1}
              className="glass-card p-8 relative overflow-hidden ai-glow-border group"
            >
              <div className="w-12 h-12 bg-ai-emerald/10 rounded-2xl flex items-center justify-center mb-6">
                <TrendingUp size={24} className="text-ai-emerald" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Seller Intelligence</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                Constructors receive instant AI scores for their property and actionable to-do lists to boost valuation and demand.
              </p>
            </motion.div>

            {/* Bento Box 3: Square */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeUpVariants}
              custom={2}
              className="glass-card p-8 group"
            >
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6">
                <Map size={24} className="text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Livability & Location</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                Automated analysis of neighborhood connectivity to schools, hospitals, and transit hubs via precise geospatial scoring.
              </p>
            </motion.div>

            {/* Bento Box 4: Large Horizontal */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeUpVariants}
              custom={3}
              className="md:col-span-2 glass-card p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 group"
            >
              <div className="flex-1">
                <div className="w-12 h-12 bg-ai-purple/10 rounded-2xl flex items-center justify-center mb-6">
                  <ShieldCheck size={24} className="text-ai-purple" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Financial & Explainable AI</h3>
                <p className="text-slate-600 leading-relaxed">
                  No black boxes. Every recommendation comes with clear natural language reasoning and calculated financial affordability metrics.
                </p>
              </div>
              <div className="flex-shrink-0 w-full md:w-auto">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 shadow-inner">
                  <div className="flex items-center gap-4 mb-4">
                    <LineChart className="text-ai-indigo" size={20} />
                    <span className="text-sm font-bold text-slate-900">AI Recommendation</span>
                  </div>
                   <div className="flex space-x-2">
                    <div className="h-8 bg-slate-200 rounded w-12 overflow-hidden"><div className="h-full w-full bg-ai-indigo rounded"></div></div>
                    <div className="h-8 bg-slate-200 rounded w-8 overflow-hidden"><div className="h-full w-full bg-ai-emerald rounded"></div></div>
                    <div className="h-8 bg-slate-200 rounded w-16 overflow-hidden"><div className="h-full w-full bg-ai-purple rounded"></div></div>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>
    </div>
  );
}
