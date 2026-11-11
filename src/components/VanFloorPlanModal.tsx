'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  Armchair, 
  Accessibility, 
  Search, 
  MapPin, 
  Locate, 
  User, 
  Building2,
  CheckCircle2,
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { AssignedSpace, TransitBooking } from '@/types';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';

interface VanFloorPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTimeSlot: string;
  selectedDay?: string;
  existingBookingsForSlot: TransitBooking[];
  onBookingSuccess: (bookingId: string) => void;
}

export interface GeocodeItem {
  id: string;
  name: string;
  display_name: string;
  lat: number;
  lon: number;
  country_code: string;
  state: string;
  is_verified_hospital: boolean;
}

// Curated verified Malaysian public & specialist hospitals registry with verified coordinates
const CURATED_MALAYSIAN_DESTINATIONS: GeocodeItem[] = [
  {
    id: 'my-hosp-htj',
    name: "Hospital Tuanku Ja'afar (HTJ)",
    display_name: "Hospital Tuanku Ja'afar, Jalan Rasah, 70300 Seremban, Negeri Sembilan, Malaysia",
    lat: 2.7167,
    lon: 101.9422,
    country_code: 'my',
    state: 'Negeri Sembilan',
    is_verified_hospital: true,
  },
  {
    id: 'my-hosp-hkl',
    name: 'Hospital Kuala Lumpur (HKL)',
    display_name: 'Hospital Kuala Lumpur, Jalan Pahang, 50586 Kuala Lumpur, Malaysia',
    lat: 3.1718,
    lon: 101.7019,
    country_code: 'my',
    state: 'Kuala Lumpur',
    is_verified_hospital: true,
  },
  {
    id: 'my-hosp-ppum',
    name: 'University Malaya Medical Centre (PPUM)',
    display_name: 'Pusat Perubatan Universiti Malaya, Lembah Pantai, 59100 Kuala Lumpur, Malaysia',
    lat: 3.1132,
    lon: 101.6534,
    country_code: 'my',
    state: 'Kuala Lumpur',
    is_verified_hospital: true,
  },
  {
    id: 'my-hosp-selayang',
    name: 'Hospital Selayang',
    display_name: 'Hospital Selayang, Lebuhraya Selayang-Kepong, 68100 Batu Caves, Selangor, Malaysia',
    lat: 3.2458,
    lon: 101.6508,
    country_code: 'my',
    state: 'Selangor',
    is_verified_hospital: true,
  },
  {
    id: 'my-hosp-serdang',
    name: 'Hospital Sultan Idris Shah (Serdang)',
    display_name: 'Hospital Sultan Idris Shah, Jalan Puchong, 43000 Kajang, Selangor, Malaysia',
    lat: 2.9765,
    lon: 101.7214,
    country_code: 'my',
    state: 'Selangor',
    is_verified_hospital: true,
  },
  {
    id: 'my-hosp-ijn',
    name: 'Institut Jantung Negara (National Heart Institute)',
    display_name: 'Institut Jantung Negara, 145 Jalan Tun Razak, 50400 Kuala Lumpur, Malaysia',
    lat: 3.1706,
    lon: 101.7118,
    country_code: 'my',
    state: 'Kuala Lumpur',
    is_verified_hospital: true,
  },
  {
    id: 'my-hosp-htar',
    name: 'Hospital Tengku Ampuan Rahimah (HTAR Klang)',
    display_name: 'Hospital Tengku Ampuan Rahimah, Jalan Langat, 41200 Klang, Selangor, Malaysia',
    lat: 3.0205,
    lon: 101.4402,
    country_code: 'my',
    state: 'Selangor',
    is_verified_hospital: true,
  },
  {
    id: 'my-hosp-sgbuloh',
    name: 'Hospital Sungai Buloh',
    display_name: 'Hospital Sungai Buloh, Jalan Hospital, 47000 Sungai Buloh, Selangor, Malaysia',
    lat: 3.2185,
    lon: 101.5818,
    country_code: 'my',
    state: 'Selangor',
    is_verified_hospital: true,
  },
  {
    id: 'my-hosp-shahalam',
    name: 'Hospital Shah Alam',
    display_name: 'Hospital Shah Alam, Seksyen 7, 40000 Shah Alam, Selangor, Malaysia',
    lat: 3.0715,
    lon: 101.4908,
    country_code: 'my',
    state: 'Selangor',
    is_verified_hospital: true,
  },
  {
    id: 'my-hosp-putrajaya',
    name: 'Hospital Putrajaya',
    display_name: 'Hospital Putrajaya, Pusat Pentadbiran Kerajaan Persekutuan, Presint 7, 62250 Putrajaya, Malaysia',
    lat: 2.9288,
    lon: 101.6742,
    country_code: 'my',
    state: 'Putrajaya',
    is_verified_hospital: true,
  },
  {
    id: 'my-hosp-sunway',
    name: 'Sunway Medical Centre',
    display_name: 'Sunway Medical Centre, 5 Jalan Lagoon Selatan, 47500 Petaling Jaya, Selangor, Malaysia',
    lat: 3.0674,
    lon: 101.6095,
    country_code: 'my',
    state: 'Selangor',
    is_verified_hospital: true,
  },
  {
    id: 'my-hosp-sjmc',
    name: 'Subang Jaya Medical Centre (SJMC)',
    display_name: 'Subang Jaya Medical Centre, 1 Jalan SS 12/1A, 47500 Subang Jaya, Selangor, Malaysia',
    lat: 3.0772,
    lon: 101.5934,
    country_code: 'my',
    state: 'Selangor',
    is_verified_hospital: true,
  },
];

export const VanFloorPlanModal: React.FC<VanFloorPlanModalProps> = ({
  isOpen,
  onClose,
  selectedTimeSlot,
  selectedDay = 'Tuesday, 10 Nov, 2026',
  existingBookingsForSlot,
  onBookingSuccess,
}) => {
  const { currentUser, createBooking } = useApp();
  const { t } = useLanguage();

  // USER SPEC: "each booking can book up to 2 seats"
  const [selectedSeats, setSelectedSeats] = useState<AssignedSpace[]>([]);

  // USER SPEC: Pickup address automatically filled with account information
  const defaultAccountPickup = currentUser?.address || 'No. 18, Jalan SS 2/19, 47300 Petaling Jaya, Selangor';
  const [pickupAddress, setPickupAddress] = useState(defaultAccountPickup);
  const [isEditingPickup, setIsEditingPickup] = useState(false);

  // Destination search & suggestions
  const [destQuery, setDestQuery] = useState("Hospital Tuanku Ja'afar (HTJ)");
  const [destSuggestions, setDestSuggestions] = useState<GeocodeItem[]>(CURATED_MALAYSIAN_DESTINATIONS);
  const [isLoadingGeo, setIsLoadingGeo] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [selectedDestinationItem, setSelectedDestinationItem] = useState<GeocodeItem | null>(CURATED_MALAYSIAN_DESTINATIONS[0]);

  const [errorMsg, setErrorMsg] = useState('');

  // Auto-filled account info from logged-in user
  const passengerName = currentUser?.full_name || 'Siti Nurhaliza binti Mansor';
  const okuId = currentUser?.ic_or_oku_number || 'DE0502198901';
  const phone = currentUser?.phone || '+60 12-491 8832';
  const mobilityType = currentUser?.mobility_type || 'Manual Wheelchair';

  // Synchronize when current user changes
  useEffect(() => {
    if (currentUser?.address) {
      setPickupAddress(currentUser.address);
    }
  }, [currentUser]);

  // Debounced search for destination suggestions
  useEffect(() => {
    if (!destQuery || destQuery.trim().length < 2) {
      setDestSuggestions(CURATED_MALAYSIAN_DESTINATIONS);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingGeo(true);
      try {
        const url = `/api/geocode?q=${encodeURIComponent(destQuery)}&countrycodes=my`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const items: GeocodeItem[] = Array.isArray(data) ? data : (data.results || []);
          if (items.length > 0) {
            setDestSuggestions(items);
          } else {
            // Local matching fallback
            const localMatches = CURATED_MALAYSIAN_DESTINATIONS.filter(h => 
              h.name.toLowerCase().includes(destQuery.toLowerCase()) ||
              h.display_name.toLowerCase().includes(destQuery.toLowerCase()) ||
              h.state.toLowerCase().includes(destQuery.toLowerCase())
            );
            setDestSuggestions(localMatches);
          }
        }
      } catch (err) {
        console.error('Failed to query geocoding:', err);
      } finally {
        setIsLoadingGeo(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [destQuery]);

  if (!isOpen) return null;

  // Occupied spaces calculation
  const occupiedSpaces = new Set<string>();
  existingBookingsForSlot.forEach(b => {
    if (b.status !== 'declined') {
      const parts = b.assigned_space.split(' + ');
      parts.forEach(p => occupiedSpaces.add(p.trim()));
    }
  });

  const handleSeatClick = (space: AssignedSpace) => {
    if (occupiedSpaces.has(space)) return;

    if (selectedSeats.includes(space)) {
      setSelectedSeats(prev => prev.filter(s => s !== space));
      setErrorMsg('');
    } else {
      if (selectedSeats.length >= 2) {
        setErrorMsg(t('vanModal.maxSeatsAllowed', 'You can book a maximum of 2 seats per booking.'));
        return;
      }
      setSelectedSeats(prev => [...prev, space]);
      setErrorMsg('');
    }
  };

  const handleSelectDestination = (item: GeocodeItem) => {
    setSelectedDestinationItem(item);
    setDestQuery(item.name);
    setShowDestDropdown(false);
    setErrorMsg('');
  };

  const handleAutoLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPickupAddress(`Current GPS Position (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
          setIsEditingPickup(false);
        },
        () => {
          setPickupAddress(defaultAccountPickup);
        }
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSeats.length === 0) {
      setErrorMsg(t('vanModal.pleaseSelectSeat', 'Please select at least 1 van space.'));
      return;
    }

    if (!pickupAddress.trim()) {
      setErrorMsg(t('vanModal.pleaseEnterPickup', 'Please enter a pickup address.'));
      return;
    }

    if (!destQuery.trim()) {
      setErrorMsg(t('vanModal.pleaseEnterDest', 'Please search and select a destination hospital.'));
      return;
    }

    const assignedSpaceString = selectedSeats.join(' + ') as AssignedSpace;

    const newBooking = createBooking({
      passenger_name: passengerName,
      oku_id: okuId,
      phone: phone,
      hospital_name: selectedDestinationItem ? selectedDestinationItem.name : destQuery,
      clinic_department: 'Main Specialist Clinic & Rehabilitation',
      appointment_time: selectedTimeSlot,
      date: selectedDay,
      assigned_space: assignedSpaceString,
      pickup_address: pickupAddress,
      mobility_type: (mobilityType as any) || 'Manual Wheelchair',
    });

    onBookingSuccess(newBooking.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
      {/* USER SPEC: Make the popup for seat selection bigger (max-w-4xl) */}
      <div className="relative w-full max-w-4xl rounded-3xl bg-white border border-neutral-200 shadow-2xl overflow-hidden my-4 sm:my-6 max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 sm:px-7 py-4 bg-neutral-50/90 shrink-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-lg font-black text-neutral-900 tracking-tight">
              {t('vanModal.seatSelection', 'Seat Selection')}
            </h2>
            <span className="rounded-lg bg-[#F37021] text-white px-3 py-1 text-xs font-black shadow-xs">
              {selectedDay.split(',')[0]}
            </span>
            <span className="rounded-lg bg-orange-100 text-orange-950 border border-orange-300 px-3 py-1 font-mono text-xs font-black">
              {selectedTimeSlot}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-neutral-500">
              · Toyota HiAce Commuter (WVV 4108)
            </span>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 hover:text-black hover:bg-neutral-200 transition-colors tap-target shrink-0"
            aria-label={t('vanModal.close', 'Close modal')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-7 flex-1 space-y-6">
          {errorMsg && (
            <div className="rounded-2xl bg-red-50 border-2 border-red-200 p-3.5 text-xs font-bold text-red-800 animate-in fade-in-50">
              {errorMsg}
            </div>
          )}

          {/* TWO COLUMN EXPANDED LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            
            {/* COLUMN 1: EXPANDED VAN FLOOR PLAN (Left - 5 Cols) */}
            <div className="lg:col-span-5 flex flex-col items-center bg-neutral-50/70 rounded-3xl border border-neutral-200 p-5 shadow-xs">
              <div className="w-full flex items-center justify-between mb-3 pb-2 border-b border-neutral-200">
                <span className="text-xs font-black uppercase tracking-wider text-neutral-900">
                  Toyota HiAce Floor Plan
                </span>
                <span className="text-[11px] font-bold text-[#F37021] bg-orange-100 px-2.5 py-0.5 rounded-full">
                  Max 2 Seats
                </span>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-neutral-600 mb-4">
                <span className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 rounded-md border-2 border-neutral-300 bg-white shadow-xs" />
                  {t('vanModal.legendAvailable', 'Available')}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 rounded-md bg-[#F37021] shadow-xs" />
                  {t('vanModal.legendSelected', 'Selected')}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 rounded-md bg-neutral-300" />
                  {t('vanModal.legendOccupied', 'Occupied')}
                </span>
              </div>

              {/* ENLARGED VAN BODY SILHOUETTE */}
              <div className="relative w-full max-w-[320px] rounded-t-[52px] rounded-b-[28px] border-2 border-neutral-800 bg-neutral-100 p-4 shadow-md">
                {/* Side Mirrors */}
                <div className="absolute -left-2.5 top-14 h-4 w-2.5 rounded-l-md bg-neutral-800" />
                <div className="absolute -right-2.5 top-14 h-4 w-2.5 rounded-r-md bg-neutral-800" />

                {/* Front Hood & Curved Windshield */}
                <div className="mb-3 text-center">
                  <div className="mx-auto h-1.5 w-12 rounded-full bg-neutral-400 mb-1.5" />
                  <div className="h-4 w-full rounded-t-[32px] border-b-2 border-neutral-400 bg-cyan-900/10 flex items-center justify-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-neutral-500">
                      Front
                    </span>
                  </div>
                </div>

                {/* ROW 1: Driver & Front Pax Seat */}
                <div className="mb-3 grid grid-cols-2 gap-3 px-1">
                  {/* Operator Driver (Fixed) */}
                  <div
                    className="h-14 rounded-2xl bg-neutral-200/90 border border-neutral-300 flex flex-col items-center justify-center text-neutral-500 shadow-xs"
                    title={t('vanModal.driverFixed', 'Operator Driver (Fixed)')}
                  >
                    <Lock className="h-4 w-4 mb-0.5 text-neutral-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Driver</span>
                  </div>

                  {/* Front Passenger Seat */}
                  {(() => {
                    const spaceName: AssignedSpace = 'Row 1: Front Passenger Seat';
                    const isOccupied = occupiedSpaces.has(spaceName);
                    const isSelected = selectedSeats.includes(spaceName);

                    return (
                      <button
                        type="button"
                        disabled={isOccupied}
                        onClick={() => handleSeatClick(spaceName)}
                        className={`h-14 rounded-2xl flex flex-col items-center justify-center transition-all tap-target border-2 ${
                          isSelected
                            ? 'bg-[#F37021] text-white border-[#F37021] shadow-md scale-102 font-black'
                            : isOccupied
                            ? 'bg-neutral-200 text-neutral-400 border-neutral-300 cursor-not-allowed'
                            : 'bg-white text-neutral-800 border-neutral-300 hover:border-[#F37021] hover:shadow-sm'
                        }`}
                        title={spaceName}
                      >
                        <Armchair className="h-5 w-5 mb-0.5" />
                        <span className="text-[10px] font-bold">Cab 1</span>
                      </button>
                    );
                  })()}
                </div>

                {/* ROW 2: 4 Regular Passenger Seats */}
                <div className="mb-3 grid grid-cols-4 gap-2 px-0.5">
                  {(['Row 2: Passenger Seat 1', 'Row 2: Passenger Seat 2', 'Row 2: Passenger Seat 3', 'Row 2: Passenger Seat 4'] as AssignedSpace[]).map((spaceName, idx) => {
                    const isOccupied = occupiedSpaces.has(spaceName);
                    const isSelected = selectedSeats.includes(spaceName);

                    return (
                      <button
                        key={spaceName}
                        type="button"
                        disabled={isOccupied}
                        onClick={() => handleSeatClick(spaceName)}
                        className={`h-13 rounded-xl flex flex-col items-center justify-center transition-all tap-target border-2 ${
                          isSelected
                            ? 'bg-[#F37021] text-white border-[#F37021] shadow-md scale-102 font-black'
                            : isOccupied
                            ? 'bg-neutral-200 text-neutral-400 border-neutral-300 cursor-not-allowed'
                            : 'bg-white text-neutral-800 border-neutral-300 hover:border-[#F37021] hover:shadow-sm'
                        }`}
                        title={spaceName}
                      >
                        <Armchair className="h-4 w-4 mb-0.5" />
                        <span className="text-[9px] font-bold">P{idx + 1}</span>
                      </button>
                    );
                  })}
                </div>

                {/* ROW 3: 2 Wheelchair Bays */}
                <div className="grid grid-cols-2 gap-3 px-1 pt-2 border-t-2 border-dashed border-neutral-300">
                  {(['Row 3: Wheelchair Bay 1', 'Row 3: Wheelchair Bay 2'] as AssignedSpace[]).map((spaceName, idx) => {
                    const isOccupied = occupiedSpaces.has(spaceName);
                    const isSelected = selectedSeats.includes(spaceName);

                    return (
                      <button
                        key={spaceName}
                        type="button"
                        disabled={isOccupied}
                        onClick={() => handleSeatClick(spaceName)}
                        className={`h-16 rounded-2xl flex flex-col items-center justify-center transition-all tap-target border-2 ${
                          isSelected
                            ? 'bg-[#F37021] text-white border-[#F37021] shadow-md scale-102 font-black'
                            : isOccupied
                            ? 'bg-neutral-200 text-neutral-400 border-neutral-300 cursor-not-allowed'
                            : 'bg-white text-neutral-800 border-neutral-300 hover:border-[#F37021] hover:shadow-sm'
                        }`}
                        title={`${spaceName} (Floor Clamps Equipped)`}
                      >
                        <Accessibility className="h-6 w-6 mb-0.5 stroke-[2.2]" />
                        <span className="text-[10px] font-bold">Wheelchair {idx + 1}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Rear Hydraulic Lift Indicator */}
                <div className="mt-3 text-center border-t border-neutral-300 pt-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-700 block">
                    {t('vanModal.rearHydraulicRamp', 'Rear Hydraulic Ramp (350kg)')}
                  </span>
                </div>
              </div>

              {/* Selected Seats Counter */}
              {selectedSeats.length > 0 ? (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
                  <span className="text-xs font-bold text-neutral-600">
                    {t('vanModal.seatsCount', 'Seats')} ({selectedSeats.length}/2):
                  </span>
                  {selectedSeats.map((seat) => (
                    <span
                      key={seat}
                      className="text-xs font-mono font-black text-white bg-[#F37021] border border-orange-600 px-3 py-1 rounded-xl shadow-xs"
                    >
                      {seat.replace('Row ', 'R')}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="mt-3 text-xs font-semibold text-neutral-500 text-center">
                  {t('vanModal.tapSeatsInstruction', 'Tap on up to 2 available seats or wheelchair bays')}
                </span>
              )}
            </div>

            {/* COLUMN 2: PASSENGER & REAL MALAYSIAN DESTINATION DETAILS (Right - 7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Account Profile Card */}
              <div className="rounded-2xl bg-orange-50/80 border border-orange-200 p-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-[#F37021] text-white flex items-center justify-center font-bold shadow-xs">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-extrabold text-neutral-900 text-sm leading-tight">
                      {passengerName}
                    </p>
                    <p className="text-xs font-mono text-neutral-600 mt-0.5">
                      OKU: {okuId} · {phone}
                    </p>
                  </div>
                </div>
                <span className="rounded-xl bg-orange-100 text-orange-950 border border-orange-300 font-extrabold px-2.5 py-1 text-xs">
                  {mobilityType}
                </span>
              </div>

              {/* Pickup Address */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-neutral-800 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-[#F37021]" />
                    {t('vanModal.pickupAddress', 'Pickup Address')}
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAutoLocate}
                      className="text-xs font-bold text-[#F37021] hover:text-[#D9530F] flex items-center gap-1"
                    >
                      <Locate className="h-3 w-3" />
                      {t('vanModal.autoLocateGPS', 'Auto-Locate GPS')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingPickup(!isEditingPickup)}
                      className="text-xs font-bold text-neutral-500 hover:text-black underline"
                    >
                      {isEditingPickup ? t('vanModal.done', 'Done') : t('vanModal.edit', 'Edit')}
                    </button>
                  </div>
                </div>

                {isEditingPickup ? (
                  <input
                    type="text"
                    required
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder="Type pickup residence address..."
                    className="apple-input w-full text-xs font-medium"
                  />
                ) : (
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-900 truncate pr-2">
                      {pickupAddress}
                    </span>
                    <span className="shrink-0 text-[10px] font-bold bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded-md">
                      {t('vanModal.accountDefault', 'Account Default')}
                    </span>
                  </div>
                )}
              </div>

              {/* DESTINATION SEARCH & REAL MALAYSIAN SUGGESTIONS */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-[#F37021]" />
                  {t('vanModal.destinationFacilityLabel', 'Destination Hospital / Medical Facility')}
                </label>

                {/* Search Bar Input */}
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <input
                      type="text"
                      required
                      value={destQuery}
                      onChange={(e) => {
                        setDestQuery(e.target.value);
                        setShowDestDropdown(true);
                      }}
                      onFocus={() => {
                        setShowDestDropdown(true);
                      }}
                      placeholder={t('vanModal.typeOrSearchHospital', 'Type or search hospital or clinic destination...')}
                      className="apple-input w-full pl-10 pr-4 text-xs font-medium"
                    />
                    {isLoadingGeo && (
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#F37021] animate-pulse">
                        {t('vanModal.searching', 'Searching...')}
                      </span>
                    )}
                  </div>

                  {/* Search Dropdown with Real Malaysian Suggestions */}
                  {showDestDropdown && destSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-2xl border border-neutral-200 bg-white shadow-2xl max-h-56 overflow-y-auto divide-y divide-neutral-100 animate-in fade-in-50">
                      <div className="p-2 bg-neutral-50 border-b border-neutral-100 flex items-center justify-between text-[11px] font-black text-neutral-600">
                        <span>{t('vanModal.suggestedDestinations', 'Suggested Destinations in Malaysia')}</span>
                        <span className="text-[10px] text-neutral-400 font-normal">Click to select</span>
                      </div>
                      {destSuggestions.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelectDestination(item)}
                          className="p-3 hover:bg-orange-50/80 cursor-pointer text-xs transition-colors flex items-start gap-2.5 tap-target"
                        >
                          <MapPin className="h-4 w-4 text-[#F37021] shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-extrabold text-neutral-900 truncate">
                                {item.name}
                              </p>
                              <span className="text-[10px] font-bold bg-orange-100 text-orange-950 px-1.5 py-0.5 rounded shrink-0">
                                {item.state}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                              {item.display_name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* USER SPEC: Allow user to click real suggested destinations within Malaysia */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-neutral-600 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-[#F37021]" />
                      {t('vanModal.suggestedDestinations', 'Suggested Destinations in Malaysia')}:
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {t('vanModal.clickToSelect', 'Click to select')}
                    </span>
                  </div>

                  {/* Clickable Real Malaysian Destination Badges */}
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {CURATED_MALAYSIAN_DESTINATIONS.map((item) => {
                      const isSelected = selectedDestinationItem?.id === item.id || destQuery === item.name;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectDestination(item)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all tap-target flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-[#F37021] text-white shadow-xs font-black ring-2 ring-orange-200'
                              : 'bg-neutral-100 hover:bg-orange-50 text-neutral-800 hover:text-[#F37021] border border-neutral-200'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                          <span>{item.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Verified Destination Card */}
                {selectedDestinationItem && (
                  <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/80 p-3.5 space-y-1.5 shadow-xs animate-in fade-in-50">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        {t('vanModal.verifiedMalaysia', 'Verified Destination within Malaysia')}
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md">
                        {selectedDestinationItem.state}
                      </span>
                    </div>
                    <p className="font-extrabold text-neutral-900 text-xs">
                      {selectedDestinationItem.name}
                    </p>
                    <p className="text-[11px] text-neutral-600 leading-snug">
                      {selectedDestinationItem.display_name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="pt-2 border-t border-neutral-200">
            <button
              type="submit"
              disabled={selectedSeats.length === 0 || !destQuery.trim()}
              className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 shadow-md tap-target transition-all active:scale-[0.99] ${
                selectedSeats.length === 0 || !destQuery.trim()
                  ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed shadow-none'
                  : 'bg-[#F37021] hover:bg-[#D9530F] text-white shadow-orange-500/20'
              }`}
            >
              <span>{t('vanModal.confirmBooking', 'Confirm & Submit Booking')}</span>
              <span className="font-mono bg-white/20 px-2.5 py-0.5 rounded-lg text-xs">
                {selectedSeats.length} {selectedSeats.length === 1 ? t('vanModal.seat', 'Seat') : t('vanModal.seats', 'Seats')} · {selectedTimeSlot}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
