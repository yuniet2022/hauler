
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Truck, Star, ArrowRight, ShieldCheck, CreditCard, RefreshCw, AlertTriangle, Package, AlertCircle, XCircle } from 'lucide-react';
import { generateSmartQuote } from '../services/geminiService';
import { ClientShipmentRequest, CarrierOffer } from '../types';
import { MOCK_CLIENT_REQUESTS, MOCK_OFFERS, US_LOCATIONS } from '../constants';

interface ClientDirectProps {
  defaultView?: 'booking' | 'tracking';
}

const ClientDirect: React.FC<ClientDirectProps> = ({ defaultView = 'booking' }) => {
  const [view, setView] = useState<'quote' | 'offers' | 'payment' | 'tracking'>(defaultView === 'tracking' ? 'tracking' : 'quote');
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<{ base: number; inoperableFee: number; total: number } | null>(null);
  
  // Form State
  const [requestDetails, setRequestDetails] = useState({ origin: '', destination: '', vehicle: '', isInoperable: false });
  const [suggestions, setSuggestions] = useState<{ field: 'origin' | 'destination' | null, list: string[] }>({ field: null, list: [] });
  
  // State for the flow
  const [activeRequest, setActiveRequest] = useState<ClientShipmentRequest>(MOCK_CLIENT_REQUESTS[0]);
  const [selectedOffer, setSelectedOffer] = useState<CarrierOffer | null>(null); // The carrier the client wants to pay for
  const [rating, setRating] = useState(0);

  // Refs to handle clicking outside
  const originRef = useRef<HTMLDivElement>(null);
  const destinationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Close suggestions on click outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // If clicking inside Origin container, don't close
      if (originRef.current && originRef.current.contains(target)) {
        return;
      }
      // If clicking inside Destination container, don't close
      if (destinationRef.current && destinationRef.current.contains(target)) {
        return;
      }
      
      // If clicking outside both, close suggestions
      setSuggestions({ field: null, list: [] });
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Address Autocomplete Logic
  const handleAddressChange = (field: 'origin' | 'destination', value: string) => {
    setRequestDetails(prev => ({ ...prev, [field]: value }));
    if (value.length > 1) {
      const filtered = US_LOCATIONS.filter(city => 
        city.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8); // Limit to 8 suggestions
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

  const handleGetQuote = async () => {
    if (!requestDetails.origin || !requestDetails.destination || !requestDetails.vehicle) {
      alert("Please fill in all mandatory fields (Origin, Destination, Vehicle).");
      return;
    }

    setLoading(true);
    const basePrice = await generateSmartQuote(requestDetails.origin, requestDetails.destination, requestDetails.vehicle, requestDetails.isInoperable);
    
    const inoperableFee = requestDetails.isInoperable ? 150 : 0;
    
    setQuote({
      base: basePrice,
      inoperableFee: inoperableFee,
      total: basePrice + inoperableFee
    });
    setLoading(false);
  };

  // STEP 1: Post Load (Without Paying)
  const handlePostLoad = () => {
    const newRequest: ClientShipmentRequest = {
      id: `R-${Date.now()}`,
      origin: requestDetails.origin,
      destination: requestDetails.destination,
      vehicleDetails: requestDetails.vehicle,
      isInoperable: requestDetails.isInoperable,
      pickupDate: new Date().toISOString().split('T')[0], // Today as default
      status: 'PENDING',
      paymentStatus: 'UNPAID', // Posted but not paid
      offers: MOCK_OFFERS, // In real app, this would be empty initially
    };
    setActiveRequest(newRequest);
    setView('offers'); // Go to Offers view to wait for carriers
  };

  // STEP 2: Select Offer -> Go to Payment
  const handleSelectOfferForPayment = (offer: CarrierOffer) => {
    setSelectedOffer(offer);
    setView('payment');
  };

  // STEP 3: Confirm Payment & Assign Carrier
  const handleConfirmPayment = () => {
    if (!selectedOffer) return;

    setActiveRequest(prev => ({
      ...prev,
      status: 'IN_TRANSIT',
      paymentStatus: 'ESCROW_HELD', // Money is now held
      trackingCode: 'TRK-998877',
      assignedCarrier: {
        name: selectedOffer.carrierName,
        rating: selectedOffer.rating,
        phone: '555-123-4567'
      }
    }));
    setView('tracking');
  };

  const handleConfirmDelivery = () => {
    const releaseDate = new Date();
    releaseDate.setHours(releaseDate.getHours() + 24); // 24 hours from now

    setActiveRequest(prev => ({
      ...prev,
      status: 'DELIVERED',
      paymentStatus: 'RELEASED_TO_CARRIER',
      escrowReleaseDate: releaseDate.toISOString()
    }));
  };

  const handleRefund = () => {
     setActiveRequest(prev => ({
      ...prev,
      status: 'CANCELLED',
      paymentStatus: 'REFUNDED'
    }));
    alert("Load cancelled and refunded.");
  };

  // NEW: Handle Carrier No-Show / Failure
  const handleCarrierFailure = () => {
    if (!activeRequest.assignedCarrier) return;

    const failedCarrierName = activeRequest.assignedCarrier.name;
    const oldRating = activeRequest.assignedCarrier.rating;
    const newRating = (oldRating - 0.5).toFixed(1); // Penalize rating

    if (window.confirm(`Report ${failedCarrierName} for failure to pickup?\n\nThis will:\n1. Penalize their rating (from ${oldRating} to ${newRating})\n2. Refund your escrow payment\n3. Repost the vehicle to the Load Board for other carriers.`)) {
      
      // Reset Request to be visible to others
      setActiveRequest(prev => ({
        ...prev,
        status: 'PENDING',
        paymentStatus: 'REFUNDED', // Money goes back so they can pay the next carrier
        assignedCarrier: undefined, // Remove carrier
        trackingCode: undefined,
        offers: MOCK_OFFERS // In real app, maybe refresh offers
      }));

      setSelectedOffer(null);
      setView('offers'); // Go back to offers page
      alert(`Report filed. ${failedCarrierName} has been penalized. Your load is now visible to other carriers.`);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Direct Shipping</h2>
        {activeRequest.trackingCode && (
          <div className="px-4 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
            Tracking: {activeRequest.trackingCode}
          </div>
        )}
      </div>

      {view === 'quote' && (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg relative">
            <h3 className="text-lg font-semibold text-white mb-4">Get Instant Quote</h3>
            <div className="space-y-4">
              {/* Origin Input with Autocomplete */}
              <div className="relative" ref={originRef}>
                <label className="text-sm text-slate-400">Pickup Location <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg p-3 mt-1 focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500 transition-all">
                  <MapPin size={18} className="text-green-500 shrink-0" />
                  <input 
                    type="text" 
                    value={requestDetails.origin}
                    placeholder="City, State or Zip" 
                    className="bg-transparent w-full outline-none text-white placeholder-slate-600"
                    onChange={e => handleAddressChange('origin', e.target.value)}
                    onFocus={() => handleAddressChange('origin', requestDetails.origin)}
                  />
                </div>
                {suggestions.field === 'origin' && suggestions.list.length > 0 && (
                  <div className="absolute z-20 w-full bg-slate-800 border border-slate-700 rounded-lg mt-1 shadow-2xl max-h-60 overflow-y-auto overflow-hidden">
                    {suggestions.list.map((city, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => selectSuggestion(city)} 
                        className="p-3 hover:bg-slate-700 cursor-pointer text-sm text-slate-200 flex items-center gap-3 border-b border-slate-700/50 last:border-0"
                      >
                         <div className="bg-slate-600/50 p-1.5 rounded-full"><MapPin size={14} className="text-slate-400"/></div>
                         {city}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Destination Input with Autocomplete */}
              <div className="relative" ref={destinationRef}>
                <label className="text-sm text-slate-400">Delivery Location <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg p-3 mt-1 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500 transition-all">
                  <MapPin size={18} className="text-red-500 shrink-0" />
                  <input 
                    type="text" 
                    value={requestDetails.destination}
                    placeholder="City, State or Zip" 
                    className="bg-transparent w-full outline-none text-white placeholder-slate-600"
                    onChange={e => handleAddressChange('destination', e.target.value)}
                    onFocus={() => handleAddressChange('destination', requestDetails.destination)}
                  />
                </div>
                {suggestions.field === 'destination' && suggestions.list.length > 0 && (
                  <div className="absolute z-20 w-full bg-slate-800 border border-slate-700 rounded-lg mt-1 shadow-2xl max-h-60 overflow-y-auto overflow-hidden">
                    {suggestions.list.map((city, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => selectSuggestion(city)} 
                        className="p-3 hover:bg-slate-700 cursor-pointer text-sm text-slate-200 flex items-center gap-3 border-b border-slate-700/50 last:border-0"
                      >
                         <div className="bg-slate-600/50 p-1.5 rounded-full"><MapPin size={14} className="text-slate-400"/></div>
                         {city}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Vehicle Details */}
              <div>
                <label className="text-sm text-slate-400">Vehicle Details <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg p-3 mt-1">
                  <Truck size={18} className="text-slate-500 shrink-0" />
                  <input 
                    type="text" 
                    placeholder="Year Make Model (e.g. 2023 Ford F-150)" 
                    className="bg-transparent w-full outline-none text-white"
                    onChange={e => setRequestDetails({...requestDetails, vehicle: e.target.value})}
                  />
                </div>
              </div>

              {/* Inoperable Toggle */}
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} className={requestDetails.isInoperable ? "text-orange-500" : "text-slate-500"} />
                  <div>
                    <div className="text-sm text-white font-medium">Inoperable Vehicle?</div>
                    <div className="text-xs text-slate-500">Does not start / Needs winch</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={requestDetails.isInoperable} onChange={e => setRequestDetails({...requestDetails, isInoperable: e.target.checked})} />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>
              
              <button 
                onClick={handleGetQuote}
                disabled={loading}
                className="w-full mt-4 bg-green-500 hover:bg-green-400 text-slate-950 font-bold py-3 rounded-lg transition-colors flex justify-center shadow-lg shadow-green-500/20"
              >
                {loading ? 'Analyzing Routes...' : 'Calculate Price'}
              </button>
            </div>
          </div>

          {/* Quote Result */}
          <div className="flex flex-col justify-center">
            {quote ? (
              <div className="bg-slate-900 border border-green-500/30 rounded-xl p-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="text-center mb-6">
                   <div className="text-slate-400 mb-2">Estimated Market Price</div>
                   <div className="text-5xl font-bold text-white mb-2">${quote.total.toFixed(0)}</div>
                   <div className="text-green-400 text-sm">Valid for 24 hours</div>
                </div>

                <div className="bg-slate-950 rounded-lg p-4 space-y-2 mb-6 text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span>Base Shipping Rate</span>
                    <span>${quote.base.toFixed(2)}</span>
                  </div>
                  {quote.inoperableFee > 0 && (
                    <div className="flex justify-between text-orange-400 font-medium">
                      <span className="flex items-center gap-1"><AlertTriangle size={12}/> Inoperable Surcharge</span>
                      <span>+${quote.inoperableFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-white font-bold pt-2 border-t border-slate-800">
                    <span>Total Estimate</span>
                    <span>${quote.total.toFixed(2)}</span>
                  </div>
                </div>

                <button 
                  onClick={handlePostLoad}
                  className="w-full bg-white hover:bg-slate-200 text-slate-900 font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                >
                  Post to Load Board (Free) <ArrowRight size={20} />
                </button>
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                   <ShieldCheck size={14} /> You only pay when you accept a carrier
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl p-12">
                <Package size={64} className="mx-auto mb-4 opacity-20" />
                <p>Enter details to see AI-powered pricing</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Offers View - Waiting for carriers */}
      {view === 'offers' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Carrier Offers</h3>
              <p className="text-xs text-slate-400">Select a carrier to proceed with payment and booking.</p>
            </div>
            <button onClick={handleRefund} className="text-xs text-red-400 hover:text-red-300 border border-red-500/20 px-3 py-1 rounded-full">
              Cancel Request
            </button>
          </div>
          
          {activeRequest.offers.map((offer) => (
            <div key={offer.id} className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center justify-between hover:border-slate-700 transition-colors">
              <div>
                <div className="flex items-center gap-3">
                  <h4 className="font-bold text-white text-lg">{offer.carrierName}</h4>
                  <div className="flex items-center gap-1 text-yellow-400 text-sm">
                    <Star size={14} fill="currentColor" /> {offer.rating}
                  </div>
                </div>
                <p className="text-slate-400 text-sm mt-1">"{offer.message}"</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">${offer.price}</div>
                <button 
                  onClick={() => handleSelectOfferForPayment(offer)}
                  className="mt-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 px-4 py-2 rounded-lg text-sm font-medium border border-green-500/20"
                >
                  Accept & Pay
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment View - Triggered AFTER selecting an offer */}
      {view === 'payment' && selectedOffer && (
        <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-8 animate-in zoom-in-95">
          <button onClick={() => setView('offers')} className="text-sm text-slate-400 hover:text-white mb-6">← Back to Offers</button>
          
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <ShieldCheck className="text-green-400" size={28} /> Secure Escrow Payment
          </h2>

          <div className="bg-slate-950 p-4 rounded-lg mb-6 border border-slate-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400 text-sm">Selected Carrier:</span>
              <span className="text-white font-bold">{selectedOffer.carrierName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Agreed Price:</span>
              <span className="text-green-400 font-bold text-lg">${selectedOffer.price.toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg mb-6">
             <h4 className="text-blue-400 font-bold text-sm mb-1">How Escrow Works:</h4>
             <ul className="text-xs text-blue-200/70 space-y-1 list-disc pl-4">
               <li>We hold <strong className="text-white">${selectedOffer.price.toFixed(2)}</strong> securely.</li>
               <li>{selectedOffer.carrierName} does not get paid until YOU confirm delivery.</li>
               <li>If the car is not picked up, you get a full refund instantly.</li>
             </ul>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-500 uppercase font-bold">Cardholder Name</label>
              <input className="w-full mt-1 bg-slate-950 border border-slate-800 rounded p-3 text-white" placeholder="John Doe" />
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase font-bold">Card Number</label>
              <div className="relative">
                 <CreditCard className="absolute left-3 top-3.5 text-slate-500" size={16} />
                 <input className="w-full mt-1 bg-slate-950 border border-slate-800 rounded p-3 pl-10 text-white" placeholder="0000 0000 0000 0000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="text-xs text-slate-500 uppercase font-bold">Expiry</label>
                 <input className="w-full mt-1 bg-slate-950 border border-slate-800 rounded p-3 text-white" placeholder="MM/YY" />
               </div>
               <div>
                 <label className="text-xs text-slate-500 uppercase font-bold">CVC</label>
                 <input className="w-full mt-1 bg-slate-950 border border-slate-800 rounded p-3 text-white" placeholder="123" />
               </div>
            </div>
          </div>

          <button 
            onClick={handleConfirmPayment}
            className="w-full mt-8 bg-green-500 hover:bg-green-400 text-slate-950 font-bold py-4 rounded-lg shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
          >
            Confirm Payment of ${selectedOffer.price.toFixed(2)}
          </button>
        </div>
      )}

      {view === 'tracking' && activeRequest.assignedCarrier && (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Amazon-style Timeline */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-semibold text-white">Shipment Progress</h3>
                 <div className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full">{activeRequest.status}</div>
              </div>
              
              <div className="space-y-8 relative pl-4 border-l-2 border-slate-800 ml-4">
                {[
                  { title: 'Load Posted', date: 'Waiting for carrier...', done: true },
                  { title: 'Carrier Accepted & Paid', date: `${activeRequest.assignedCarrier.name} assigned`, done: true },
                  { title: 'Vehicle Picked Up', date: 'In Transit', done: true },
                  { title: 'Delivered', date: activeRequest.status === 'DELIVERED' ? 'Arrived at Destination' : 'Estimating Arrival...', done: activeRequest.status === 'DELIVERED' || activeRequest.status === 'COMPLETED' },
                ].map((step, idx) => (
                  <div key={idx} className="relative">
                    <div className={`absolute -left-[25px] top-0 w-4 h-4 rounded-full border-2 ${step.done ? 'bg-green-500 border-green-500' : 'bg-slate-900 border-slate-600'}`}></div>
                    <h4 className={`text-sm font-medium ${step.done ? 'text-white' : 'text-slate-500'}`}>{step.title}</h4>
                    <p className="text-xs text-slate-500">{step.date}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Confirmation Action */}
            {activeRequest.status === 'IN_TRANSIT' && (
              <div className="bg-slate-900 border border-green-500/30 p-6 rounded-xl text-center">
                 <h3 className="text-white font-bold mb-2">Has the vehicle arrived?</h3>
                 <p className="text-slate-400 text-sm mb-4">Confirming delivery releases payment to the carrier in 24 hours.</p>
                 <button 
                  onClick={handleConfirmDelivery}
                  className="bg-green-500 hover:bg-green-400 text-slate-950 font-bold px-8 py-3 rounded-lg shadow-lg shadow-green-500/20"
                 >
                   Yes, Confirm Delivery
                 </button>
              </div>
            )}

            {activeRequest.status === 'DELIVERED' && activeRequest.paymentStatus === 'RELEASED_TO_CARRIER' && (
               <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-xl flex items-start gap-4">
                  <RefreshCw className="text-blue-400 shrink-0" />
                  <div>
                    <h4 className="text-blue-400 font-bold">Payment Scheduled</h4>
                    <p className="text-blue-200/70 text-sm mt-1">
                      Funds will be released to {activeRequest.assignedCarrier.name} on {new Date(activeRequest.escrowReleaseDate || '').toLocaleString()}.
                    </p>
                  </div>
               </div>
            )}
          </div>

          <div className="space-y-6">
             {/* Driver Card */}
             <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-sm text-slate-400 uppercase font-bold mb-4">Your Carrier</h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-xl">🚚</div>
                  <div>
                    <div className="font-bold text-white">{activeRequest.assignedCarrier.name}</div>
                    <div className="text-sm text-slate-400 flex items-center gap-1">
                      <Star size={12} className="text-yellow-400" fill="currentColor" /> {activeRequest.assignedCarrier.rating}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <button className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-sm">
                    Call: {activeRequest.assignedCarrier.phone}
                  </button>
                  
                  {/* Report Issue Button - ONLY for IN_TRANSIT */}
                  {activeRequest.status === 'IN_TRANSIT' && (
                     <button 
                       onClick={handleCarrierFailure}
                       className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 py-2 rounded-lg text-sm flex items-center justify-center gap-2 mt-4"
                     >
                       <XCircle size={16} /> Report Failed Pickup
                     </button>
                  )}
                </div>
             </div>

             {/* Rating */}
             {activeRequest.status === 'DELIVERED' && (
                <div className="bg-slate-900 border border-green-500/30 rounded-xl p-6 text-center">
                   <h3 className="font-bold text-white mb-2">Rate your experience</h3>
                   <div className="flex justify-center gap-2 mb-4">
                     {[1,2,3,4,5].map(star => (
                       <button key={star} onClick={() => setRating(star)} className={`hover:scale-110 transition ${star <= rating ? 'text-yellow-400' : 'text-slate-700'}`}>
                         <Star size={24} fill="currentColor" />
                       </button>
                     ))}
                   </div>
                   <button className="w-full bg-green-500 text-slate-950 font-bold py-2 rounded">Submit Review</button>
                </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDirect;