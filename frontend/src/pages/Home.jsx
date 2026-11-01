import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ChevronDown } from 'lucide-react';

import { propertyAPI } from '../services/api';
import PropertyCard from '../components/cards/PropertyCard';
import AILivePreview from '../components/reactbits/AILivePreview';

const CHECKS = [
  {
    term: 'Location score',
    detail: 'Distance to schools, hospitals, offices and the nearest metro or station, worked out from the map rather than the brochure.',
  },
  {
    term: 'Air quality',
    detail: 'The AQI reading for the neighbourhood, so you know what the balcony air is like before you visit.',
  },
  {
    term: 'Fair-price check',
    detail: 'How the asking price compares with similar listings nearby, shown as a percentage above or below.',
  },
  {
    term: 'Side-by-side comparison',
    detail: 'Monthly EMI, maintenance, commute and the trade-offs between two homes, written in plain English.',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    propertyAPI.getAll({ limit: 6, page: 1 })
      .then(res => {
        const data = res.data?.data;
        setRecent((data?.properties || (Array.isArray(data) ? data : [])).slice(0, 6));
      })
      .catch(err => console.error('Failed to load recent listings', err));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (propertyType) params.set('type', propertyType);
    const qs = params.toString();
    navigate(`/properties${qs ? `?${qs}` : ''}`);
  };

  return (
    <div className="w-full">
      {/* ── Search hero ── */}
      <section className="relative bg-ink-900 text-white">
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-35"
        />
        <div className="relative container-app py-20 md:py-28">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight max-w-2xl leading-tight">
            Find a home, and know what you're paying for.
          </h1>
          <p className="mt-4 text-lg text-ink-100 max-w-xl">
            Every listing is checked for location, air quality and whether the asking price is fair.
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-8 bg-white rounded-lg p-2 flex flex-col sm:flex-row gap-2 max-w-3xl"
          >
            <label className="sr-only" htmlFor="home-search">City, locality or project</label>
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                id="home-search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="City, locality or project — e.g. Baner, 3 BHK"
                className="w-full h-12 pl-10 pr-3 rounded-md text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-ink-700"
              />
            </div>
            <div className="relative sm:w-44">
              <label className="sr-only" htmlFor="home-type">Property type</label>
              <select
                id="home-type"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full h-12 appearance-none pl-3 pr-8 rounded-md border border-line text-ink-800 bg-white focus:outline-none focus:ring-2 focus:ring-ink-700 cursor-pointer"
              >
                <option value="">All types</option>
                <option value="Apartment">Apartment</option>
                <option value="Villa">Villa</option>
                <option value="Office">Office</option>
                <option value="Plot">Plot</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
            </div>
            <button type="submit" className="btn-primary h-12 !px-8">
              Search
            </button>
          </form>
        </div>
      </section>

      {/* ── Recent listings ── */}
      <section className="container-app py-14">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-ink-900">Recently listed</h2>
            <p className="text-sm text-ink-500 mt-1">The latest homes added to SmartSite</p>
          </div>
          <Link to="/properties" className="text-sm font-semibold text-brick-600 hover:underline no-underline whitespace-nowrap">
            See all homes
          </Link>
        </div>

        {recent.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recent.map((p, i) => <PropertyCard key={p._id || i} property={p} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg border border-line h-[360px] animate-pulse">
                <div className="h-52 bg-ink-100 rounded-t-lg" />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── What we check ── */}
      <section className="bg-white border-y border-line">
        <div className="container-app py-14 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <h2 className="text-2xl font-bold text-ink-900">What we check on every listing</h2>
            <p className="text-sm text-ink-600 mt-3 leading-relaxed">
              Photos show you the flat. These show you the rest: the commute, the air and the price.
            </p>
          </div>
          <dl className="lg:col-span-8 divide-y divide-line border-t border-line">
            {CHECKS.map(item => (
              <div key={item.term} className="py-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <dt className="font-semibold text-ink-900">{item.term}</dt>
                <dd className="sm:col-span-2 text-sm text-ink-600 leading-relaxed">{item.detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Match score demo ── */}
      <section className="container-app py-14">
        <div className="max-w-2xl mb-8">
          <h2 className="text-2xl font-bold text-ink-900">Weigh what matters to you</h2>
          <p className="text-sm text-ink-600 mt-2">
            Move the sliders to see how a home's match score changes when you care more about returns, transit or amenities.
          </p>
        </div>
        <AILivePreview />
      </section>

      {/* ── Sellers ── */}
      <section className="bg-ink-900 text-white">
        <div className="container-app py-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold">Selling a home or plot?</h2>
            <p className="text-ink-200 mt-2 max-w-xl text-sm">
              List it, see how SmartSite's scores rate it, and get a list of changes that would raise its value.
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/register?role=seller" className="btn-primary no-underline">
              Post a property
            </Link>
            <Link to="/register?role=buyer" className="btn-secondary !bg-transparent !text-white !border-ink-500 hover:!border-white no-underline">
              I'm buying
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
