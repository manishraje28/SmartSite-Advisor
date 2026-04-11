import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { propertyAPI } from '../services/api';
import {
  Building2, MapPin, Ruler, Image, Check, ChevronRight,
  ChevronLeft, Sparkles, AlertTriangle, Home, DollarSign
} from 'lucide-react';

const STEPS = [
  { label: 'Basics', icon: Building2 },
  { label: 'Location', icon: MapPin },
  { label: 'Details', icon: Ruler },
  { label: 'Amenities', icon: Home },
  { label: 'Pricing', icon: DollarSign },
];

const AMENITY_OPTIONS = [
  'Lift', 'Gym', 'Swimming Pool', 'Parking', 'Security', 'Power Backup',
  'Garden', 'Clubhouse', 'CCTV', 'Intercom', 'Children Play Area',
  'Jogging Track', 'Tennis Court', 'Basketball Court', 'Gas Pipeline',
  'Rainwater Harvesting', 'Solar Panels', 'Maintenance Staff',
];

export default function CreateProperty() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    propertyType: 'Apartment',
    listingType: 'Sale',
    price: '',
    pricePerSqFt: '',
    address: '',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '',
    bedrooms: '2',
    bathrooms: '2',
    balconies: '1',
    carpetArea: '',
    builtUpArea: '',
    floor: '',
    totalFloors: '',
    parkingSpots: '1',
    facing: 'East',
    furnishingStatus: 'Semi-Furnished',
    age: '0',
    amenities: ['Lift', 'Parking', 'Security'],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const toggleAmenity = (amenity) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        propertyType: form.propertyType,
        listingType: form.listingType,
        price: Number(form.price),
        pricePerSqFt: Number(form.pricePerSqFt || 0),
        seller: user?._id,
        location: {
          type: 'Point',
          coordinates: [77.5946, 12.9716],
          address: form.address,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
        },
        specifications: {
          bedrooms: Number(form.bedrooms),
          bathrooms: Number(form.bathrooms),
          balconies: Number(form.balconies),
          carpetArea: Number(form.carpetArea),
          builtUpArea: Number(form.builtUpArea || form.carpetArea),
          floor: Number(form.floor || 0),
          totalFloors: Number(form.totalFloors || 0),
          parkingSpots: Number(form.parkingSpots),
          facing: form.facing,
          furnishingStatus: form.furnishingStatus,
          age: Number(form.age),
        },
        amenities: form.amenities,
        images: ['/images/property-1.png'],
      };

      const res = await propertyAPI.create(payload);
      if (res.data.success) {
        navigate('/seller/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create property');
    }
    setLoading(false);
  };

  const nextStep = () => step < STEPS.length - 1 && setStep(step + 1);
  const prevStep = () => step > 0 && setStep(step - 1);

  return (
    <div className="container-app py-6 pb-12 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <Sparkles size={18} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">List New Property</h1>
            <p className="text-xs text-on-surface-variant">Complete all steps to publish your listing</p>
          </div>
        </div>
      </motion.div>

      {/* Step Indicator */}
      <div className="glass-card p-5 mb-6">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={s.label} className="flex items-center gap-2.5 flex-1">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${isDone ? 'bg-emerald-500/15' : isActive ? 'bg-indigo-500/15' : 'bg-surface-container-highest'
                  }`}>
                  {isDone ? (
                    <Check size={16} className="text-emerald-400" />
                  ) : (
                    <Icon size={16} className={isActive ? 'text-primary' : 'text-on-surface-variant/50'} />
                  )}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${isActive ? 'text-primary' : isDone ? 'text-emerald-400' : 'text-on-surface-variant/50'
                  }`}>{s.label}</span>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 rounded-full mx-2 ${isDone ? 'bg-emerald-500' : 'bg-surface-container-highest'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center gap-2.5 p-4 rounded-xl bg-error-container/20 border border-error/20 text-error text-sm mb-6">
          <AlertTriangle size={16} /> {error}
        </motion.div>
      )}

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="glass-card p-7"
        >
          {/* Step 0: Basics */}
          {step === 0 && (
            <div className="space-y-6">
              <h3 className="font-semibold text-xl mb-4">Basic Information</h3>
              <div>
                <label className="label-sm block mb-2">Property Title</label>
                <input name="title" value={form.title} onChange={handleChange} className="input-field" placeholder="e.g., Prestige Lakeside 3BHK" required />
              </div>
              <div>
                <label className="label-sm block mb-2">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} className="input-field min-h-[120px]" placeholder="Describe your property..." />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="label-sm block mb-2">Property Type</label>
                  <select name="propertyType" value={form.propertyType} onChange={handleChange} className="input-field">
                    <option value="Apartment">Apartment</option>
                    <option value="Villa">Villa</option>
                    <option value="Plot">Plot</option>
                    <option value="Office">Office</option>
                    <option value="Studio">Studio</option>
                  </select>
                </div>
                <div>
                  <label className="label-sm block mb-2">Listing Type</label>
                  <select name="listingType" value={form.listingType} onChange={handleChange} className="input-field">
                    <option value="Sale">Sale</option>
                    <option value="Rent">Rent</option>
                    <option value="Lease">Lease</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Location */}
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="font-semibold text-xl mb-4">Location Details</h3>
              <div>
                <label className="label-sm block mb-2">Full Address</label>
                <input name="address" value={form.address} onChange={handleChange} className="input-field" placeholder="Building name, street, area" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label-sm block mb-2">City</label>
                  <input name="city" value={form.city} onChange={handleChange} className="input-field" />
                </div>
                <div>
                  <label className="label-sm block mb-2">State</label>
                  <input name="state" value={form.state} onChange={handleChange} className="input-field" />
                </div>
                <div>
                  <label className="label-sm block mb-2">Pincode</label>
                  <input name="pincode" value={form.pincode} onChange={handleChange} className="input-field" placeholder="560001" />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="space-y-5">
              <h3 className="font-semibold text-lg mb-2">Property Specifications</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label-sm block mb-2">Bedrooms</label>
                  <input type="number" name="bedrooms" value={form.bedrooms} onChange={handleChange} className="input-field" />
                </div>
                <div>
                  <label className="label-sm block mb-2">Bathrooms</label>
                  <input type="number" name="bathrooms" value={form.bathrooms} onChange={handleChange} className="input-field" />
                </div>
                <div>
                  <label className="label-sm block mb-2">Balconies</label>
                  <input type="number" name="balconies" value={form.balconies} onChange={handleChange} className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="label-sm block mb-2">Carpet Area (sqft)</label>
                  <input type="number" name="carpetArea" value={form.carpetArea} onChange={handleChange} className="input-field" placeholder="1200" />
                </div>
                <div>
                  <label className="label-sm block mb-2">Built-up Area (sqft)</label>
                  <input type="number" name="builtUpArea" value={form.builtUpArea} onChange={handleChange} className="input-field" placeholder="1450" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label-sm block mb-2">Floor</label>
                  <input type="number" name="floor" value={form.floor} onChange={handleChange} className="input-field" />
                </div>
                <div>
                  <label className="label-sm block mb-2">Total Floors</label>
                  <input type="number" name="totalFloors" value={form.totalFloors} onChange={handleChange} className="input-field" />
                </div>
                <div>
                  <label className="label-sm block mb-2">Parking</label>
                  <input type="number" name="parkingSpots" value={form.parkingSpots} onChange={handleChange} className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label-sm block mb-2">Facing</label>
                  <select name="facing" value={form.facing} onChange={handleChange} className="input-field">
                    <option>East</option><option>West</option><option>North</option><option>South</option>
                    <option>North-East</option><option>South-East</option>
                  </select>
                </div>
                <div>
                  <label className="label-sm block mb-2">Furnishing</label>
                  <select name="furnishingStatus" value={form.furnishingStatus} onChange={handleChange} className="input-field">
                    <option>Unfurnished</option><option>Semi-Furnished</option><option>Fully-Furnished</option>
                  </select>
                </div>
                <div>
                  <label className="label-sm block mb-2">Age (years)</label>
                  <input type="number" name="age" value={form.age} onChange={handleChange} className="input-field" />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Amenities */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="font-semibold text-xl mb-4">Select Amenities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AMENITY_OPTIONS.map(amenity => (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${form.amenities.includes(amenity)
                        ? 'bg-indigo-500/15 text-primary border border-indigo-500/25'
                        : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-highest/80 border border-transparent'
                      }`}
                  >
                    {form.amenities.includes(amenity) ? '✓  ' : ''}{amenity}
                  </button>
                ))}
              </div>
              <p className="text-xs text-on-surface-variant mt-4">{form.amenities.length} amenities selected</p>
            </div>
          )}

          {/* Step 4: Pricing */}
          {step === 4 && (
            <div className="space-y-5">
              <h3 className="font-semibold text-lg mb-2">Pricing</h3>
              <div>
                <label className="label-sm block mb-2">Total Price (₹)</label>
                <input type="number" name="price" value={form.price} onChange={handleChange} className="input-field" placeholder="12000000" required />
                {form.price && (
                  <p className="text-xs text-on-surface-variant mt-2">
                    = ₹{(Number(form.price) / 10000000).toFixed(2)} Cr
                  </p>
                )}
              </div>
              <div>
                <label className="label-sm block mb-2">Price per sqft (₹)</label>
                <input type="number" name="pricePerSqFt" value={form.pricePerSqFt} onChange={handleChange} className="input-field" placeholder="8000" />
              </div>

              {/* Summary */}
              <div className="p-5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 border border-emerald-500/10 mt-2">
                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Sparkles size={14} className="text-emerald-400" />
                  Listing Summary
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-on-surface-variant">Title:</span> <span className="text-on-surface font-medium">{form.title || '—'}</span></div>
                  <div><span className="text-on-surface-variant">Type:</span> <span className="text-on-surface font-medium">{form.propertyType}</span></div>
                  <div><span className="text-on-surface-variant">Location:</span> <span className="text-on-surface font-medium">{form.city}</span></div>
                  <div><span className="text-on-surface-variant">Size:</span> <span className="text-on-surface font-medium">{form.carpetArea || '—'} sqft</span></div>
                  <div><span className="text-on-surface-variant">Config:</span> <span className="text-on-surface font-medium">{form.bedrooms}BHK</span></div>
                  <div><span className="text-on-surface-variant">Amenities:</span> <span className="text-on-surface font-medium">{form.amenities.length} selected</span></div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-8">
        <button
          onClick={prevStep}
          disabled={step === 0}
          className="btn-secondary flex items-center gap-2 disabled:opacity-30"
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        {step < STEPS.length - 1 ? (
          <button onClick={nextStep} className="btn-primary flex items-center gap-2">
            Next
            <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading || !form.title || !form.price}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles size={16} />
                Publish Listing
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
