import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { propertyAPI } from '../services/api';
import { MapPin, Check, ChevronRight, ChevronLeft, AlertTriangle } from 'lucide-react';

const STEPS = [
  { label: 'Basics' },
  { label: 'Location' },
  { label: 'Details' },
  { label: 'Amenities' },
  { label: 'Pricing' },
];

const AMENITY_OPTIONS = [
  'Lift', 'Gym', 'Swimming Pool', 'Parking', 'Security', 'Power Backup',
  'Garden', 'Clubhouse', 'CCTV', 'Intercom', 'Children Play Area',
  'Jogging Track', 'Tennis Court', 'Basketball Court', 'Gas Pipeline',
  'Rainwater Harvesting', 'Solar Panels', 'Maintenance Staff',
];

export default function CreateProperty() {
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
    city: 'Mumbai',
    state: 'Maharashtra',
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

  // { status: 'idle' | 'checking' | 'ok' | 'error', text }
  const [addressCheck, setAddressCheck] = useState({ status: 'idle', text: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (['address', 'city', 'pincode'].includes(name)) setAddressCheck({ status: 'idle', text: '' });
  };

  const verifyAddress = async () => {
    setAddressCheck({ status: 'checking', text: '' });
    try {
      const res = await propertyAPI.previewLocation({ address: form.address, city: form.city, pincode: form.pincode });
      setAddressCheck({ status: 'ok', text: res.data.data.formattedAddress });
    } catch (err) {
      setAddressCheck({ status: 'error', text: err.response?.data?.message || 'Could not verify this address.' });
    }
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
        location: {
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
  const canProceed = step !== 1 || addressCheck.status === 'ok';
  const prevStep = () => step > 0 && setStep(step - 1);

  return (
    <div className="container-app pt-8 pb-12 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-ink-900">List a property</h1>
        <p className="text-sm text-ink-500 mt-1">Complete all steps to publish your listing.</p>
      </div>

      {/* Step Indicator */}
      <ol className="glass-card flex divide-x divide-line mb-6 overflow-hidden">
        {STEPS.map((s, i) => {
          const isActive = i === step;
          const isDone = i < step;
          return (
            <li
              key={s.label}
              aria-current={isActive ? 'step' : undefined}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-3 text-xs sm:text-sm border-b-2 ${isActive ? 'border-b-ink-900 text-ink-900 font-semibold' : isDone ? 'border-b-transparent text-moss-700 font-medium' : 'border-b-transparent text-ink-500'}`}
            >
              {isDone && <Check size={14} className="flex-shrink-0" />}
              <span>{s.label}</span>
            </li>
          );
        })}
      </ol>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          role="alert" className="flex items-center gap-2.5 p-3.5 rounded-md bg-[#fdf1f0] border border-[#f6d3cf] text-[#b42318] text-sm font-medium mb-6">
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
          className="glass-card p-6 md:p-8"
        >
          {/* Step 0: Basics */}
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-ink-900 pb-3 border-b border-line">Basic information</h2>
              <div>
                <label htmlFor="cp-title" className="label-sm block mb-1.5">Property title</label>
                <input id="cp-title" name="title" value={form.title} onChange={handleChange} className="input-field" placeholder="e.g., Prestige Lakeside 3BHK" required />
              </div>
              <div>
                <label htmlFor="cp-description" className="label-sm block mb-1.5">Description</label>
                <textarea id="cp-description" name="description" value={form.description} onChange={handleChange} className="input-field min-h-[120px]" placeholder="Describe your property..." />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cp-propertyType" className="label-sm block mb-1.5">Property type</label>
                  <select id="cp-propertyType" name="propertyType" value={form.propertyType} onChange={handleChange} className="input-field">
                    <option value="Apartment">Apartment</option>
                    <option value="Villa">Villa</option>
                    <option value="Plot">Plot</option>
                    <option value="Office">Office</option>
                    <option value="Studio">Studio</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="cp-listingType" className="label-sm block mb-1.5">Listing type</label>
                  <select id="cp-listingType" name="listingType" value={form.listingType} onChange={handleChange} className="input-field">
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
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-ink-900 pb-3 border-b border-line">Location</h2>
              <div>
                <label htmlFor="cp-address" className="label-sm block mb-1.5">Full address</label>
                <input id="cp-address" name="address" value={form.address} onChange={handleChange} className="input-field" placeholder="Building name, street, area" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="cp-city" className="label-sm block mb-1.5">City</label>
                  <select id="cp-city" name="city" value={form.city} onChange={handleChange} className="input-field">
                    <option value="Mumbai">Mumbai</option>
                    <option value="Thane">Thane</option>
                    <option value="Navi Mumbai">Navi Mumbai</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="cp-state" className="label-sm block mb-1.5">State</label>
                  <input id="cp-state" name="state" value={form.state} className="input-field" readOnly />
                </div>
                <div>
                  <label htmlFor="cp-pincode" className="label-sm block mb-1.5">Pincode</label>
                  <input id="cp-pincode" name="pincode" value={form.pincode} onChange={handleChange} className="input-field" placeholder="400050" />
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={verifyAddress}
                  disabled={!form.address.trim() || addressCheck.status === 'checking'}
                  className="btn-secondary text-sm gap-2"
                >
                  <MapPin size={16} />
                  {addressCheck.status === 'checking' ? 'Locating...' : 'Verify address on map'}
                </button>
                {addressCheck.status === 'ok' && (
                  <div className="p-3 rounded-md bg-moss-50 border border-moss-100 text-moss-700 text-sm">
                    <div className="font-semibold flex items-center gap-1.5"><Check size={14} /> Your listing will be placed at:</div>
                    <div className="mt-0.5">{addressCheck.text}</div>
                    <div className="text-xs text-ink-500 mt-1">If this isn't the right place, edit the address and verify again.</div>
                  </div>
                )}
                {addressCheck.status === 'error' && (
                  <div role="alert" className="p-3 rounded-md bg-[#fdf1f0] border border-[#f6d3cf] text-[#b42318] text-sm flex items-start gap-1.5">
                    <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" /> {addressCheck.text}
                  </div>
                )}
                {addressCheck.status === 'idle' && (
                  <p className="text-xs text-ink-500">Verify the address to continue. It sets the map pin, nearby places and AQI for your listing.</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-ink-900 pb-3 border-b border-line">Specifications</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="cp-bedrooms" className="label-sm block mb-1.5">Bedrooms</label>
                  <input id="cp-bedrooms" type="number" name="bedrooms" value={form.bedrooms} onChange={handleChange} className="input-field" />
                </div>
                <div>
                  <label htmlFor="cp-bathrooms" className="label-sm block mb-1.5">Bathrooms</label>
                  <input id="cp-bathrooms" type="number" name="bathrooms" value={form.bathrooms} onChange={handleChange} className="input-field" />
                </div>
                <div>
                  <label htmlFor="cp-balconies" className="label-sm block mb-1.5">Balconies</label>
                  <input id="cp-balconies" type="number" name="balconies" value={form.balconies} onChange={handleChange} className="input-field" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cp-carpetArea" className="label-sm block mb-1.5">Carpet area (sq ft)</label>
                  <input id="cp-carpetArea" type="number" name="carpetArea" value={form.carpetArea} onChange={handleChange} className="input-field" placeholder="1200" />
                </div>
                <div>
                  <label htmlFor="cp-builtUpArea" className="label-sm block mb-1.5">Built-up area (sq ft)</label>
                  <input id="cp-builtUpArea" type="number" name="builtUpArea" value={form.builtUpArea} onChange={handleChange} className="input-field" placeholder="1450" />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="cp-floor" className="label-sm block mb-1.5">Floor</label>
                  <input id="cp-floor" type="number" name="floor" value={form.floor} onChange={handleChange} className="input-field" />
                </div>
                <div>
                  <label htmlFor="cp-totalFloors" className="label-sm block mb-1.5">Total floors</label>
                  <input id="cp-totalFloors" type="number" name="totalFloors" value={form.totalFloors} onChange={handleChange} className="input-field" />
                </div>
                <div>
                  <label htmlFor="cp-parkingSpots" className="label-sm block mb-1.5">Parking</label>
                  <input id="cp-parkingSpots" type="number" name="parkingSpots" value={form.parkingSpots} onChange={handleChange} className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="cp-facing" className="label-sm block mb-1.5">Facing</label>
                  <select id="cp-facing" name="facing" value={form.facing} onChange={handleChange} className="input-field">
                    <option>East</option><option>West</option><option>North</option><option>South</option>
                    <option>North-East</option><option>South-East</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="cp-furnishingStatus" className="label-sm block mb-1.5">Furnishing</label>
                  <select id="cp-furnishingStatus" name="furnishingStatus" value={form.furnishingStatus} onChange={handleChange} className="input-field">
                    <option>Unfurnished</option><option>Semi-Furnished</option><option>Fully-Furnished</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="cp-age" className="label-sm block mb-1.5">Age (years)</label>
                  <input id="cp-age" type="number" name="age" value={form.age} onChange={handleChange} className="input-field" />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Amenities */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-ink-900 pb-3 border-b border-line">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AMENITY_OPTIONS.map(amenity => (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    aria-pressed={form.amenities.includes(amenity)}
                    className={`px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-left flex items-center gap-2 border ${form.amenities.includes(amenity)
                        ? 'bg-ink-50 text-ink-900 border-ink-700'
                        : 'bg-white text-ink-700 border-line hover:border-ink-300'
                      }`}
                  >
                    <Check size={14} className={form.amenities.includes(amenity) ? 'text-ink-900' : 'invisible'} />
                    {amenity}
                  </button>
                ))}
              </div>
              <p className="text-xs text-ink-500 tabular">{form.amenities.length} amenities selected</p>
            </div>
          )}

          {/* Step 4: Pricing */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-ink-900 pb-3 border-b border-line">Pricing</h2>
              <div>
                <label htmlFor="cp-price" className="label-sm block mb-1.5">Total price (₹)</label>
                <input id="cp-price" type="number" name="price" value={form.price} onChange={handleChange} className="input-field tabular" placeholder="12000000" required />
                {form.price && (
                  <p className="text-xs text-ink-500 mt-1.5 tabular">
                    = ₹{(Number(form.price) / 10000000).toFixed(2)} Cr
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="cp-pricePerSqFt" className="label-sm block mb-1.5">Price per sq ft (₹)</label>
                <input id="cp-pricePerSqFt" type="number" name="pricePerSqFt" value={form.pricePerSqFt} onChange={handleChange} className="input-field" placeholder="8000" />
              </div>

              {/* Summary */}
              <div className="pt-5 border-t border-line">
                <h3 className="text-sm font-bold text-ink-900 mb-3">Listing summary</h3>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div><span className="text-ink-500">Title:</span> <span className="text-ink-900 font-medium tabular">{form.title || '—'}</span></div>
                  <div><span className="text-ink-500">Type:</span> <span className="text-ink-900 font-medium tabular">{form.propertyType}</span></div>
                  <div><span className="text-ink-500">Location:</span> <span className="text-ink-900 font-medium tabular">{form.city}</span></div>
                  <div><span className="text-ink-500">Size:</span> <span className="text-ink-900 font-medium tabular">{form.carpetArea || '—'} sqft</span></div>
                  <div><span className="text-ink-500">Config:</span> <span className="text-ink-900 font-medium tabular">{form.bedrooms}BHK</span></div>
                  <div><span className="text-ink-500">Amenities:</span> <span className="text-ink-900 font-medium tabular">{form.amenities.length} selected</span></div>
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
          className="btn-secondary text-sm gap-2"
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        {step < STEPS.length - 1 ? (
          <button onClick={nextStep} disabled={!canProceed} className="btn-primary text-sm gap-2">
            Next
            <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading || !form.title || !form.price}
            className="btn-emerald text-sm gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
'Publish listing'
            )}
          </button>
        )}
      </div>
    </div>
  );
}
