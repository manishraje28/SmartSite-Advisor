import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Sparkles, Brain, BarChart3, Shield, ArrowRight,
  Building2, Users, TrendingUp, Zap, Target, GitCompare,
  IndianRupee, MapPin, Star, ChevronRight
} from 'lucide-react';

const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

const stats = [
  { value: '2,500+', label: 'Properties Analyzed', icon: Building2, color: 'text-indigo-400' },
  { value: '95%', label: 'Match Accuracy', icon: Target, color: 'text-emerald-400' },
  { value: '₹850 Cr', label: 'Transaction Value', icon: IndianRupee, color: 'text-purple-400' },
  { value: '12,000+', label: 'Happy Buyers', icon: Users, color: 'text-amber-400' },
];

const features = [
  {
    icon: Brain,
    title: 'AI Matchmaking',
    desc: 'Multi-agent analysis matches properties to your exact lifestyle weights — ROI, amenities, location, and more.',
    color: 'from-indigo-500/15 to-indigo-500/5',
    iconColor: 'text-indigo-400',
  },
  {
    icon: BarChart3,
    title: 'Seller Intelligence',
    desc: 'AI scoring engine grades your property, suggests improvements, and tracks market demand in real-time.',
    color: 'from-emerald-500/15 to-emerald-500/5',
    iconColor: 'text-emerald-400',
  },
  {
    icon: GitCompare,
    title: 'Smart Comparison',
    desc: 'Side-by-side property analysis with radar charts, AI insights, and personalized winner explanation.',
    color: 'from-purple-500/15 to-purple-500/5',
    iconColor: 'text-purple-400',
  },
  {
    icon: Shield,
    title: 'Explainable AI',
    desc: 'Every recommendation comes with transparent reasoning — no black box decisions.',
    color: 'from-amber-500/15 to-amber-500/5',
    iconColor: 'text-amber-400',
  },
];

const propertyShowcase = [
  { img: '/images/property-1.png', title: 'Prestige Lakeside', location: 'Whitefield', price: '₹1.2 Cr', score: 88 },
  { img: '/images/property-2.png', title: 'Brigade Gateway', location: 'Rajajinagar', price: '₹1.8 Cr', score: 85 },
  { img: '/images/property-3.png', title: 'Sobha Dream Acres', location: 'Panathur', price: '₹95 L', score: 79 },
];

export default function Home() {
  return (
    <div className="overflow-hidden">
      {/* ── HERO ── */}
      <section className="relative min-h-[85vh] flex items-center">
        {/* Background Glow */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-emerald-500/8 rounded-full blur-[100px]" />
        </div>

        <div className="container-app relative z-10 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div variants={fadeUpVariants} custom={0} initial="hidden" animate="visible"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-8"
            >
              <Sparkles size={14} className="text-indigo-400" />
              <span className="text-xs font-medium text-indigo-300 tracking-wide">AI-Powered Real Estate Intelligence</span>
            </motion.div>

            <motion.h1 variants={fadeUpVariants} custom={1} initial="hidden" animate="visible"
              className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight mb-8"
            >
              <span className="text-on-surface">Make Smarter</span>
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-primary to-emerald-400 bg-clip-text text-transparent">
                Property Decisions
              </span>
            </motion.h1>

            <motion.p variants={fadeUpVariants} custom={2} initial="hidden" animate="visible"
              className="text-lg md:text-xl text-on-surface-variant max-w-xl mx-auto mb-10 leading-relaxed"
            >
              SmartSite uses multi-agent AI to match buyers with ideal properties 
              and help sellers maximize their listings — with transparent, explainable reasoning.
            </motion.p>

            <motion.div variants={fadeUpVariants} custom={3} initial="hidden" animate="visible"
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to="/register" className="btn-primary !px-8 !py-4 text-base flex items-center gap-2 justify-center no-underline">
                <Sparkles size={18} />
                Start Free
                <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="btn-secondary !px-8 !py-4 text-base flex items-center gap-2 justify-center no-underline">
                Sign In
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="py-10 border-y border-white/5">
        <div className="container-app">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={fadeUpVariants}
                custom={i}
                className="text-center py-2"
              >
                <stat.icon size={22} className={`${stat.color} mx-auto mb-3`} />
                <div className="text-2xl md:text-3xl font-bold text-on-surface mb-1">{stat.value}</div>
                <div className="text-xs text-on-surface-variant tracking-wide">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES BENTO GRID ── */}
      <section className="py-24">
        <div className="container-app">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.div variants={fadeUpVariants} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-5">
              <Zap size={12} className="text-emerald-400" />
              <span className="text-xs font-medium text-emerald-300 tracking-wide">Why SmartSite</span>
            </motion.div>
            <motion.h2 variants={fadeUpVariants} custom={1} className="text-3xl md:text-4xl font-bold mb-4">
              Intelligence at Every Step
            </motion.h2>
            <motion.p variants={fadeUpVariants} custom={2} className="text-on-surface-variant max-w-lg mx-auto text-lg">
              Not just listings — an AI decision ecosystem for both sides of the market.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-5"
          >
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUpVariants}
                custom={i}
                whileHover={{ scale: 1.02 }}
                className={`glass-card p-8 bg-gradient-to-br ${f.color} hover:shadow-card-hover transition-all duration-300`}
              >
                <div className={`w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center mb-5`}>
                  <f.icon size={22} className={f.iconColor} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{f.title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── PROPERTY SHOWCASE ── */}
      <section className="py-24 bg-surface-container-low/30">
        <div className="container-app">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.h2 variants={fadeUpVariants} custom={0} className="text-3xl md:text-4xl font-bold mb-4">
              Featured Properties
            </motion.h2>
            <motion.p variants={fadeUpVariants} custom={1} className="text-on-surface-variant text-lg">
              AI-scored and ranked for maximum confidence
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6"
          >
            {propertyShowcase.map((prop, i) => (
              <motion.div
                key={prop.title}
                variants={fadeUpVariants}
                custom={i}
                whileHover={{ y: -6 }}
                className="glass-card overflow-hidden group"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={prop.img}
                    alt={prop.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/30 to-transparent" />
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-emerald-500/20 backdrop-blur-sm flex items-center gap-1">
                    <Star size={11} className="text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400">{prop.score}</span>
                  </div>
                  <div className="absolute bottom-3 left-4">
                    <div className="text-xl font-bold text-white">{prop.price}</div>
                  </div>
                </div>
                <div className="p-5">
                  <h4 className="font-semibold text-on-surface mb-1.5">{prop.title}</h4>
                  <div className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                    <MapPin size={13} />
                    {prop.location}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div className="text-center mt-10">
            <Link to="/register" className="btn-emerald !px-7 !py-3 inline-flex items-center gap-2 no-underline">
              Explore All Properties
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24">
        <div className="container-app">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.h2 variants={fadeUpVariants} custom={0} className="text-3xl md:text-4xl font-bold mb-4">How SmartSite Works</motion.h2>
            <motion.p variants={fadeUpVariants} custom={1} className="text-on-surface-variant text-lg">Three steps to your perfect property match</motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              { step: '01', title: 'Set Your Priorities', desc: 'Tell us what matters — adjust sliders for ROI, location, amenities, and more.', icon: Target },
              { step: '02', title: 'AI Analyzes & Matches', desc: 'Our multi-agent AI scores every property and ranks them against your weights.', icon: Brain },
              { step: '03', title: 'Decide with Confidence', desc: 'Compare top matches side-by-side with transparent AI explanations.', icon: Sparkles },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                variants={fadeUpVariants}
                custom={i}
                className="relative text-center px-6 py-10 glass-card bg-surface-container-low/20 overflow-hidden"
              >
                <div className="absolute -top-4 right-1/2 translate-x-1/2 text-[120px] font-black text-white/5 pointer-events-none select-none leading-none z-0">
                  {item.step}
                </div>
                <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/15 to-emerald-500/15 flex items-center justify-center mx-auto mb-6">
                  <item.icon size={28} className="text-primary" />
                </div>
                <h4 className="relative z-10 font-bold text-on-surface text-xl mb-3">{item.title}</h4>
                <p className="relative z-10 text-sm text-on-surface-variant leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24">
        <div className="container-app">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUpVariants}
            className="relative overflow-hidden rounded-3xl p-12 md:p-20 text-center bg-gradient-to-br from-indigo-500/15 via-surface-container to-emerald-500/10 border border-indigo-500/10"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/8 rounded-full blur-[60px]" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Ready to Find Your{' '}
                <span className="bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                  Perfect Property?
                </span>
              </h2>
              <p className="text-on-surface-variant max-w-md mx-auto mb-10 text-lg">
                Join thousands of buyers and sellers using AI to make smarter real estate decisions.
              </p>
              <Link to="/register" className="btn-primary !px-10 !py-4 text-base inline-flex items-center gap-2 no-underline relative z-20">
                <Sparkles size={18} />
                Get Started — It's Free
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 border-t border-white/5">
        <div className="container-app text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-400 flex items-center justify-center">
              <Building2 size={15} className="text-white" />
            </div>
            <span className="font-bold text-on-surface text-lg">SmartSite</span>
          </div>
          <p className="text-sm text-on-surface-variant">
            © 2026 SmartSite. AI-Powered Construction Intelligence Platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
