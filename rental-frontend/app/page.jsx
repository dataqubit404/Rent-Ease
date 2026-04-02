'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Search, MapPin, Star, Shield, Zap, Home, TrendingUp, ArrowRight, ChevronDown, Building2, TreePine, Waves } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { useScrollReveal } from '../hooks/useScrollReveal';

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1800&q=90',
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1800&q=90',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1800&q=90',
];

const STATS = [
  { label: 'Properties Listed', value: '12,400+' },
  { label: 'Happy Tenants', value: '38,000+' },
  { label: 'Cities Covered', value: '120+' },
  { label: 'Avg. Rating', value: '4.9 ★' },
];

const FEATURES = [
  { icon: Search, title: 'Smart Search', desc: 'Filter by location, price, type, and availability in real-time.' },
  { icon: Shield, title: 'Verified Listings', desc: 'Every property is reviewed and verified by our team.' },
  { icon: Zap, title: 'Instant Booking', desc: 'Book your ideal property in minutes with secure payments.' },
  { icon: TrendingUp, title: 'Best Prices', desc: 'Transparent pricing with no hidden fees. Ever.' },
];

const PROPERTY_TYPES = [
  { icon: Home, label: 'Apartments', count: '4,200+', color: 'from-violet-500 to-purple-600' },
  { icon: Building2, label: 'Villas', count: '1,800+', color: 'from-blue-500 to-cyan-600' },
  { icon: TreePine, label: 'Studios', count: '3,100+', color: 'from-emerald-500 to-teal-600' },
  { icon: Waves, label: 'Penthouses', count: '900+', color: 'from-orange-500 to-red-500' },
];

export default function LandingPage() {
  const router = useRouter();
  const [heroIndex, setHeroIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const heroRef = useRef(null);
  const featRef = useScrollReveal();
  const statsRef = useScrollReveal();
  const typesRef = useScrollReveal();

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    const t = setInterval(() => setHeroIndex(i => (i + 1) % HERO_IMAGES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    router.push(`/properties?search=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative h-screen min-h-[680px] overflow-hidden">
        {/* Background images with parallax */}
        <motion.div className="absolute inset-0" style={{ y: heroY }}>
          {HERO_IMAGES.map((img, i) => (
            <motion.div
              key={img}
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${img})` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: i === heroIndex ? 1 : 0 }}
              transition={{ duration: 1.2 }}
            />
          ))}
        </motion.div>
        <div className="absolute inset-0 bg-hero-gradient" />

        {/* Content */}
        <motion.div
          className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4"
          style={{ opacity: heroOpacity }}
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="inline-flex items-center gap-2 glass text-white/90 text-sm font-medium px-4 py-2 rounded-full mb-6">
              <Star size={13} className="fill-gold-400 text-gold-400" />
              <span>Rated #1 Rental Platform in India</span>
            </div>

            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.05] mb-6 max-w-5xl mx-auto">
              Bored of searching?<br />
              <span className="italic font-light">You're at the</span>{' '}
              <span style={{ background: 'linear-gradient(135deg, #a78bfa, #6172f0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                right place.
              </span>
            </h1>

            <p className="text-white/75 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-light">
              Discover thousands of verified properties. Book instantly. Live comfortably.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.form
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            onSubmit={handleSearch}
            className="w-full max-w-2xl"
          >
            <div className="glass flex items-center gap-3 p-2 rounded-2xl shadow-float">
              <div className="flex items-center gap-2 flex-1 px-3">
                <MapPin size={18} className="text-white/60 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search city, area, or property name..."
                  className="w-full bg-transparent text-white placeholder-white/50 outline-none text-base font-body"
                />
              </div>
              <button type="submit" className="btn-primary shrink-0 rounded-xl px-6 py-3 text-sm">
                <Search size={16} />
                Search
              </button>
            </div>
          </motion.form>

          {/* Quick links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex flex-wrap justify-center gap-2 mt-6"
          >
            {['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad'].map(city => (
              <button
                key={city}
                onClick={() => router.push(`/properties?city=${city}`)}
                className="glass text-white/80 text-sm px-3 py-1.5 rounded-full hover:bg-white/15 transition-all"
              >
                {city}
              </button>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50"
        >
          <ChevronDown size={24} />
        </motion.div>

        {/* Hero image dots */}
        <div className="absolute bottom-8 right-8 flex gap-2">
          {HERO_IMAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === heroIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`}
            />
          ))}
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────────── */}
      <section ref={statsRef} className="section-reveal py-16 bg-white border-b border-gray-100">
        <div className="page-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="font-display text-4xl font-bold gradient-text mb-1">{stat.value}</p>
                <p className="text-gray-500 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROPERTY TYPES ───────────────────────────────────────────────────── */}
      <section ref={typesRef} className="section-reveal py-24 bg-surface-2">
        <div className="page-container">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Browse by <span className="gradient-text">Property Type</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">Every type of home, for every kind of life.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PROPERTY_TYPES.map((type, i) => (
              <motion.div
                key={type.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6 }}
                onClick={() => router.push(`/properties?property_type=${type.label.toLowerCase().slice(0, -1)}`)}
                className="cursor-pointer bg-white rounded-2xl p-6 text-center shadow-sm hover:shadow-float transition-all border border-gray-100"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${type.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <type.icon size={24} className="text-white" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{type.label}</h3>
                <p className="text-gray-400 text-sm">{type.count} listings</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────────── */}
      <section ref={featRef} className="section-reveal py-24 bg-white">
        <div className="page-container">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why choose <span className="gradient-text">RentEase?</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">Everything you need to find, book, and manage your perfect rental.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="p-6 rounded-2xl bg-gray-50 hover:bg-brand-50 border border-transparent hover:border-brand-100 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-gradient flex items-center justify-center mb-4 shadow-brand group-hover:shadow-brand-lg transition-shadow">
                  <f.icon size={20} className="text-white" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-gradient" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 50%, white 0%, transparent 50%)' }} />
        <div className="relative page-container text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl md:text-6xl font-bold mb-6">
              Ready to find your<br />dream rental?
            </h2>
            <p className="text-white/75 text-lg mb-10 max-w-lg mx-auto">
              Join thousands of happy tenants and owners on RentEase today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/properties" className="bg-white text-brand-600 font-semibold px-8 py-4 rounded-xl hover:shadow-lg transition-all hover:-translate-y-1 flex items-center gap-2">
                <Search size={18} />
                Browse Properties
              </Link>
              <Link href="/auth/register" className="glass text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/20 transition-all flex items-center gap-2">
                List Your Property
                <ArrowRight size={18} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
