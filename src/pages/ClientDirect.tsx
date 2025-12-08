import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Truck, Star, ArrowRight, ShieldCheck, CreditCard, RefreshCw, AlertTriangle, Package, AlertCircle, XCircle, Edit2, DollarSign } from 'lucide-react';
import { ClientShipmentRequest, CarrierOffer } from '../types';
import { MOCK_CLIENT_REQUESTS, MOCK_OFFERS, US_LOCATIONS } from '../constants';

interface ClientDirectProps {
  defaultView?: 'booking' | 'tracking';
}

const ClientDirect: React.FC<ClientDirectProps> = ({ defaultView = 'booking' }) => {
  // SAFE INITIALIZATION: Check if data exists first
  const [activeRequest, setActiveRequest] = useState<ClientShipmentRequest | null>(
    MOCK_CLIENT_REQUESTS.length > 0 ? MOCK_CLIENT_REQUESTS[0] : null
  );

  const [view, setView] = useState<'create' | 'offers' | 'payment' | 'tracking'>(
    activeRequest ? (defaultView === 'tracking' ? 'tracking' : 'offers') : 'create'
  );
  
  // Form State
  const [requestDetails, setRequestDetails] = useState({ origin: '', destination: '', vehicle: '', isInoperable: false });
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [suggestions, setSuggestions] = useState<{ field: 'origin' | 'destination' | null, list: string[] }>({ field: null, list: [] });
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const [selectedOffer, setSelectedOffer] = useState<CarrierOffer | null>(null);
  
  // Refs to handle clicking outside
  const originRef = useRef<HTMLDivElement>(null);
  const destinationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Close suggestions on click outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (originRef.current && originRef.current.contains(target)) return;
      if (destinationRef.current && destinationRef.current.contains(target)) return;
      setSuggestions({ field: null, list: [] });
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddressChange = (field: 'origin' | 'destination', value: string) => {
    setRequestDetails(prev => ({ ...prev, [field]: value }));
    if (value.length > 1) {
      const filtered = US_LOCATIONS.filter(city => 
        city.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8);
      setSuggestions({ field, list: filtered });
    } else {
      setSuggestions({ field: null, list: [] });
    }
  };

  const selectSuggestion = (value: string) => {
    if (suggestions.field) {
      setRequestDetails(prev => ({ ...prev, [suggestions.field!]: value }));
      setSuggestions({ field: null, list: [] });
    }
  };

  const handlePriceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val === '') { setTargetPrice(''); return; }
    const num = parseInt(val, 10);
    if (!isNaN(num) && num <= 10000) { setTargetPrice(val); }
  };

  const validateAndPost = () => {
    const errors: string[] = [];
    if (!requestDetails.origin) errors.push("Pickup location is required.");
    if (!requestDetails.destination) errors.push("Delivery location is required.");
    if (!requestDetails.vehicle) errors.push("Vehicle details are required.");
    const price = Number(targetPrice);
    if (!targetPrice) errors.push("You must enter a price offer.");
    else if (price <= 0) errors.push("Price must be greater than $0.");
    else if (price > 10000) errors.push("Price cannot exceed $10,000.");
    setFormErrors(errors);
    if (errors.length === 0) { handlePostLoad(); }
  };

  const handlePostLoad = () => {
    const newRequest: ClientShipmentRequest = {
      id: `R-${Date.now()}`,
      origin: requestDetails.origin,
      destination: requestDetails.destination,
      vehicleDetails: requestDetails.vehicle,
      isInoperable: requestDetails.isInoperable,
      pickupDate: new Date().toISOString().split('T')[0],
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      offers: [], 
      targetPrice: Number(targetPrice)
    };
    setActiveRequest(newRequest);
    setView('offers');
  };

  const handleSelectOfferForPayment = (offer: CarrierOffer) => {
    setSelectedOffer(offer);
    setView('payment');
  };

  const handleConfirmPayment = () => {
    if (!selectedOffer || !activeRequest) return;
    setActiveRequest({
      ...activeRequest,
      status: 'IN_TRANSIT',
      paymentStatus: 'ESCROW_HELD',
      trackingCode: 'TRK-998877',
      assignedCarrier: {
        name: selectedOffer.carrierName,
        rating: selectedOffer.rating,
        phone: '555-123-4567'
      }
    });
    setView('tracking');
  };

  const handleConfirmDelivery = () => {
    if (!activeRequest) return;
    const releaseDate = new Date();
    releaseDate.setHours(releaseDate.getHours() + 24);
    setActiveRequest({
      ...activeRequest,
      status: 'DELIVERED',
      paymentStatus: 'RELEASED_TO_CARRIER',
      escrowReleaseDate: releaseDate.toISOString()
    });
  };

  const handleRefund = () => {
     if (!activeRequest) return;
     setActiveRequest({ ...activeRequest, status: 'CANCELLED', paymentStatus: 'REFUNDED' });
    alert("Load cancelled and refunded.");
  };

  const handleCarrierFailure = () => {
    if (!activeRequest?.assignedCarrier) return;
    if (window.confirm(`Report failure to pickup?`)) {
      setActiveRequest({
        ...activeRequest,
        status: 'PENDING',
        paymentStatus: 'REFUNDED',
        assignedCarrier: undefined,
        trackingCode: undefined,
        offers: []
      });
      setSelectedOffer(null);
      setView('offers');
      alert(`Report filed. Carrier penalized.`);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Direct Shipping</h2>
        {/* SAFE ACCESS: Using ?. to prevent crash if activeRequest is null */}
        {activeRequest?.trackingCode && (
          <div className="px-4 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
            Tracking: {activeRequest.trackingCode}
          </div>
        )}
      </div>

      {(view === 'create' || !activeRequest) && (
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-lg relative">
            <h3 className="text-xl font-semibold text-white mb-6">Create Shipment Request</h3>
            <div className="space-y-5">
              <div className="relative" ref={originRef}>
                <label className="text-sm text-slate-400 font-bold uppercase">Pickup Location <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg p-3 mt-1 focus-within:border-green-500 transition-all">
                  <MapPin size={18} className="text-green-500 shrink-0" />
                  <input type="text" value={requestDetails.origin} placeholder="City, State or Zip" className="bg-transparent w-full outline-none text-white placeholder-slate-600" onChange={e => handleAddressChange('origin', e.target.value)} onFocus={() => handleAddressChange('origin', requestDetails.origin)} />
                </div>
                {suggestions.field === 'origin' && suggestions.list.length > 0 && (
                  <div className="absolute z-20 w-full bg-slate-800 border border-slate-700 rounded-lg mt-1 shadow-2xl max-h-60 overflow-y-auto">
                    {suggestions.list.map((city, idx) => (<div key={idx} onClick={() => selectSuggestion(city)} className="p-3 hover:bg-slate-700 cursor-pointer text-sm text-slate-200 border-b border-slate-700/50">{city}</div>))}
                  </div>
                )}
              </div>

              <div className="relative" ref={destinationRef}>
                <label className="text-sm text-slate-400 font-bold uppercase">Delivery Location <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg p-3 mt-1 focus-within:border-red-500 transition-all">
                  <MapPin size={18} className="text-red-500 shrink-0" />
                  <input type="text" value={requestDetails.destination} placeholder="City, State or Zip" className="bg-transparent w-full outline-none text-white placeholder-slate-600" onChange={e => handleAddressChange('destination', e.target.value)} onFocus={() => handleAddressChange('destination', requestDetails.destination)} />
                </div>
                {suggestions.field === 'destination' && suggestions.list.length > 0 && (
                  <div className="absolute z-20 w-full bg-slate-800 border border-slate-700 rounded-lg mt-1 shadow-2xl max-h-60 overflow-y-auto">
                    {suggestions.list.map((city, idx) => (<div key={idx} onClick={() => selectSuggestion(city)} className="p-3 hover:bg-slate-700 cursor-pointer text-sm text-slate-200 border-b border-slate-700/50">{city}</div>))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm text-slate-400 font-bold uppercase">Vehicle Details <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg p-3 mt-1">
                  <Truck size={18} className="text-slate-500 shrink-0" />
                  <input type="text" placeholder="Year Make Model" className="bg-transparent w-full outline-none text-white" onChange={e => setRequestDetails({...requestDetails, vehicle: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <label className="text-sm font-bold text-green-400 flex items-center gap-2 mb-2 uppercase"><DollarSign size={14} /> Your Offer Price <span className="text-red-500">*</span></label>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-white">$</span>
                      <input type="text" inputMode="numeric" pattern="[0-9]*" value={targetPrice} onChange={handlePriceInput} placeholder="0" className="bg-transparent text-xl font-bold text-white outline-none w-full placeholder-slate-700" />
                    </div>
                 </div>
                 <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={18} className={requestDetails.isInoperable ? "text-orange-500" : "text-slate-500"} />
                      <div><div className="text-xs text-slate-300 font-bold uppercase">Inoperable?</div><div className="text-[10px] text-slate-500">Needs winch</div></div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={requestDetails.isInoperable} onChange={e => setRequestDetails({...requestDetails, isInoperable: e.target.checked})} />
                      <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 peer-checked:bg-orange-500"></div>
                    </label>
                 </div>
              </div>
              
              {formErrors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 animate-in fade-in">
                  <div className="flex items-center gap-2 text-red-400 font-bold mb-1"><AlertCircle size={16} /> Please fix the following:</div>
                  <ul className="list-disc list-inside text-sm text-red-300">{formErrors.map((err, idx) => <li key={idx}>{err}</li>)}</ul>
                </div>
              )}

              <button onClick={validateAndPost} className="w-full mt-4 bg-green-500 hover:bg-green-400 text-slate-900 font-bold py-4 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-green-500/20">Post to Load Board <ArrowRight size={20} /></button>
            </div>
        </div>
      )}

      {view === 'offers' && activeRequest && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex justify-between items-center mb-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
            <div><h3 className="text-lg font-semibold text-white">Your Posted Load</h3><p className="text-sm text-green-400 font-bold">Offer Price: ${activeRequest.targetPrice}</p></div>
            <button onClick={handleRefund} className="text-xs text-red-400 border border-red-500/20 px-3 py-1 rounded-full">Cancel Request</button>
          </div>
          
          {activeRequest.offers.length === 0 ? (
             <div className="text-center p-8 bg-slate-900/50 rounded-xl border border-dashed border-slate-800 text-slate-500">
                Waiting for carriers to bid on your load...
             </div>
          ) : (
             activeRequest.offers.map((offer) => (
                <div key={offer.id} className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center justify-between">
                  <div><div className="flex items-center gap-3"><h4 className="font-bold text-white text-lg">{offer.carrierName}</h4><div className="flex items-center gap-1 text-yellow-400 text-sm"><Star size={14} fill="currentColor" /> {offer.rating}</div></div><p className="text-slate-400 text-sm mt-1">"{offer.message}"</p></div>
                  <div className="text-right"><div className="text-2xl font-bold text-green-400">${offer.price}</div><button onClick={() => handleSelectOfferForPayment(offer)} className="mt-2 bg-green-500/10 text-green-400 px-4 py-2 rounded-lg text-sm font-medium border border-green-500/20 hover:bg-green-500/20">Accept & Pay</button></div>
                </div>
             ))
          )}
        </div>
      )}

      {view === 'payment' && selectedOffer && activeRequest && (
        <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-8">
           <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3"><ShieldCheck className="text-green-400" size={28} /> Secure Payment</h2>
           <div className="bg-slate-950 p-4 rounded-lg mb-6 border border-slate-800">
             <div className="flex justify-between mb-2"><span className="text-slate-400">Carrier:</span><span className="text-white font-bold">{selectedOffer.carrierName}</span></div>
             <div className="flex justify-between"><span className="text-slate-400">Price:</span><span className="text-green-400 font-bold">${selectedOffer.price.toFixed(2)}</span></div>
           </div>
           <button onClick={handleConfirmPayment} className="w-full bg-green-500 text-slate-950 font-bold py-4 rounded-lg">Confirm Payment</button>
        </div>
      )}

      {view === 'tracking' && activeRequest?.assignedCarrier && (
         <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
             <h3 className="text-lg font-bold text-white mb-4">Shipment Tracking</h3>
             <div className="text-sm text-slate-400 mb-6">Status: <span className="text-white font-bold">{activeRequest.status}</span></div>
             {activeRequest.status === 'IN_TRANSIT' && (<button onClick={handleConfirmDelivery} className="bg-green-500 text-slate-950 font-bold px-6 py-3 rounded-lg mb-4">Confirm Delivery</button>)}
             <button onClick={handleCarrierFailure} className="text-red-400 text-sm underline">Report Issue</button>
         </div>
      )}
    </div>
  );
};
export default ClientDirect;