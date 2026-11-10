'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  Unlock,
  Armchair, 
  Accessibility, 
  Search, 
  MapPin, 
  Locate, 
  ShieldCheck, 
  Check, 
  User, 
  CheckCircle2,
  Building2,
  AlertTriangle
} from 'lucide-react';
import { AssignedSpace, MobilityType, TransitBooking } from '@/types';
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

interface GeocodeItem {
  id: string;
  name: string;
  display_name: string;
  lat: number;
  lon: number;
  country_code: string;
  state: string;
  is_verified_hospital: boolean;
}

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
  const [destSuggestions, setDestSuggestions] = useState<GeocodeItem[]>([]);
  const [isLoadingGeo, setIsLoadingGeo] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [selectedDestinationItem, setSelectedDestinationItem] = useState<GeocodeItem | null>({
    id: 'my-hosp-htj',
    name: "Hospital Tuanku Ja'afar (HTJ)",
    display_name: "Hospital Tuanku Ja'afar, Jalan Rasah, 70300 Seremban, Negeri Sembilan, Malaysia",
    lat: 2.7167,
    lon: 101.9422,
    country_code: 'my',
    state: 'Negeri Sembilan',
    is_verified_hospital: true,
  });

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
      setDestSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingGeo(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(destQuery)}`);
        if (res.ok) {
          const data: GeocodeItem[] = await res.json();
          const myOnly = data.filter(d => d.country_code.toLowerCase() === 'my');
          setDestSuggestions(myOnly);
        }
      } catch (e) {
        console.warn('Geocode fetch error', e);
      } finally {
        setIsLoadingGeo(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [destQuery]);

  if (!isOpen) return null;

  // Occupied spaces (split commas in case previous booking booked 2 seats)
  const occupiedSpaces = new Set(
    existingBookingsForSlot
      .filter(b => b.status !== 'declined')
      .flatMap(b => b.assigned_space ? b.assigned_space.split(',').map(s => s.trim()) : [])
  );

  // USER SPEC: "each booking can book up to 2 seats"
  const handleSeatClick = (seat: AssignedSpace) => {
    if (occupiedSpaces.has(seat)) return;
    setErrorMsg('');
    if (selectedSeats.includes(seat)) {
      setSelectedSeats(prev => prev.filter(s => s !== seat));
    } else {
      if (selectedSeats.length >= 2) {
        setSelectedSeats([selectedSeats[1], seat]);
      } else {
        setSelectedSeats(prev => [...prev, seat]);
      }
    }
  };

  const handleSelectDestination = (item: GeocodeItem) => {
    setSelectedDestinationItem(item);
    setDestQuery(item.name);
    setShowDestDropdown(false);
    setErrorMsg('');
  };

  const handleAutoLocate = () => {
    setPickupAddress('Current GPS: No. 18, Jalan SS 2/19, Petaling Jaya');
    setIsEditingPickup(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSeats.length === 0) {
      setErrorMsg('Please select at least 1 seat on the van plan (up to 2 seats).');
      return;
    }
    if (!pickupAddress.trim()) {
      setErrorMsg('Pickup address is required.');
      return;
    }
    if (!destQuery.trim()) {
      setErrorMsg('Destination hospital or facility is required.');
      return;
    }

    const newBooking = createBooking({
      appointment_time: selectedTimeSlot,
      date: selectedDay,
      assigned_space: selectedSeats.join(', ') as AssignedSpace,
      pickup_address: pickupAddress,
      hospital_name: destQuery.trim(),
      clinic_department: 'Hospital Accessible Transit',
      destination_coordinates: selectedDestinationItem ? {
        lat: selectedDestinationItem.lat,
        lon: selectedDestinationItem.lon,
      } : {
        lat: 2.7167,
        lon: 101.9422,
      },
      destination_verified: true,
      mobility_type: mobilityType,
      passenger_name: passengerName,
      oku_id: okuId,
      phone: phone,
    });

    onBookingSuccess(newBooking.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl bg-white border border-neutral-200 shadow-2xl my-6 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3.5 bg-neutral-50/80">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-neutral-900">
              {t('vanModal.seatSelection', 'Seat Selection')}
            </h2>
            <span className="rounded-md bg-[#F37021] text-white px-2.5 py-0.5 text-xs font-bold">
              {selectedDay.split(',')[0]}
            </span>
            <span className="rounded-md bg-orange-50 text-orange-950 border border-orange-200 px-2.5 py-0.5 font-mono text-xs font-black">
              {selectedTimeSlot}
            </span>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:text-black hover:bg-neutral-200 transition-colors tap-target"
            aria-label={t('vanModal.close', 'Close modal')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-bold text-red-800">
              {errorMsg}
            </div>
          )}

          {/* ============================================================== */}
          {/* COMPACT TOP-DOWN VAN SILHOUETTE WITH SEAT ICONS ONLY           */}
          {/* ============================================================== */}
          <div className="flex flex-col items-center">
            {/* Legend */}
            <div className="flex items-center gap-4 text-[10px] font-bold text-neutral-500 mb-2.5">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-md border-2 border-neutral-300 bg-white" />
                {t('vanModal.legendAvailable', 'Available')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-md bg-[#F37021]" />
                {t('vanModal.legendSelected', 'Selected')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-md bg-neutral-300" />
                {t('vanModal.legendOccupied', 'Occupied')}
              </span>
            </div>

            {/* Van Body */}
            <div className="relative w-60 rounded-t-[44px] rounded-b-[24px] border-2 border-neutral-800 bg-neutral-100/90 p-3 shadow-md">
              {/* Left & Right Side Mirrors */}
              <div className="absolute -left-2 top-12 h-3.5 w-2 rounded-l-md bg-neutral-800" />
              <div className="absolute -right-2 top-12 h-3.5 w-2 rounded-r-md bg-neutral-800" />

              {/* Front Hood & Curved Windshield */}
              <div className="mb-2.5 text-center">
                <div className="mx-auto h-1 w-10 rounded-full bg-neutral-400 mb-1" />
                <div className="h-3 w-full rounded-t-[24px] border-b-2 border-neutral-400 bg-cyan-900/10" />
              </div>

              {/* ROW 1: Driver & Front Pax */}
              <div className="mb-2 grid grid-cols-2 gap-2.5 px-1">
                {/* Driver */}
                <div
                  className="h-10 rounded-xl bg-neutral-200 border border-neutral-300 flex items-center justify-center text-neutral-400"
                  title="Operator Driver (Fixed)"
                >
                  <Lock className="h-4 w-4" />
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
                      className={`h-10 rounded-xl flex items-center justify-center transition-all tap-target border-2 ${
                        isSelected
                          ? 'bg-[#F37021] text-white border-[#F37021] shadow-md scale-105'
                          : isOccupied
                          ? 'bg-neutral-200 text-neutral-400 border-neutral-300 cursor-not-allowed'
                          : 'bg-white text-neutral-800 border-neutral-300 hover:border-[#F37021] hover:scale-105'
                      }`}
                      title={spaceName}
                    >
                      <Armchair className="h-5 w-5" />
                    </button>
                  );
                })()}
              </div>

              {/* ROW 2: 4 Regular Passenger Seats */}
              <div className="mb-2 grid grid-cols-4 gap-1.5 px-0.5">
                {(['Row 2: Passenger Seat 1', 'Row 2: Passenger Seat 2', 'Row 2: Passenger Seat 3', 'Row 2: Passenger Seat 4'] as AssignedSpace[]).map((spaceName) => {
                  const isOccupied = occupiedSpaces.has(spaceName);
                  const isSelected = selectedSeats.includes(spaceName);

                  return (
                    <button
                      key={spaceName}
                      type="button"
                      disabled={isOccupied}
                      onClick={() => handleSeatClick(spaceName)}
                      className={`h-9 rounded-xl flex items-center justify-center transition-all tap-target border-2 ${
                        isSelected
                          ? 'bg-[#F37021] text-white border-[#F37021] shadow-md scale-105'
                          : isOccupied
                          ? 'bg-neutral-200 text-neutral-400 border-neutral-300 cursor-not-allowed'
                          : 'bg-white text-neutral-800 border-neutral-300 hover:border-[#F37021] hover:scale-105'
                      }`}
                      title={spaceName}
                    >
                      <Armchair className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>

              {/* ROW 3: 2 Wheelchair Bays */}
              <div className="grid grid-cols-2 gap-2.5 px-1 pt-1 border-t border-dashed border-neutral-300">
                {(['Row 3: Wheelchair Bay 1', 'Row 3: Wheelchair Bay 2'] as AssignedSpace[]).map((spaceName) => {
                  const isOccupied = occupiedSpaces.has(spaceName);
                  const isSelected = selectedSeats.includes(spaceName);

                  return (
                    <button
                      key={spaceName}
                      type="button"
                      disabled={isOccupied}
                      onClick={() => handleSeatClick(spaceName)}
                      className={`h-11 rounded-xl flex items-center justify-center transition-all tap-target border-2 ${
                        isSelected
                          ? 'bg-[#F37021] text-white border-[#F37021] shadow-md scale-105'
                          : isOccupied
                          ? 'bg-neutral-200 text-neutral-400 border-neutral-300 cursor-not-allowed'
                          : 'bg-white text-neutral-800 border-neutral-300 hover:border-[#F37021] hover:scale-105'
                      }`}
                      title={`${spaceName} (Floor Clamps Equipped)`}
                    >
                      <Accessibility className="h-5 w-5 stroke-[2]" />
                    </button>
                  );
                })}
              </div>

              {/* Rear Hydraulic Lift Indicator */}
              <div className="mt-2 text-center border-t border-neutral-300 pt-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-600">
                  Rear Hydraulic Ramp
                </span>
              </div>
            </div>

            {selectedSeats.length > 0 ? (
              <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5">
                <span className="text-[11px] font-bold text-neutral-600">
                  Seats ({selectedSeats.length}/2):
                </span>
                {selectedSeats.map((seat) => (
                  <span
                    key={seat}
                    className="text-[11px] font-mono font-black text-white bg-[#F37021] border border-orange-600 px-2.5 py-0.5 rounded-lg shadow-xs"
                  >
                    {seat}
                  </span>
                ))}
              </div>
            ) : (
              <span className="mt-2 text-[11px] font-medium text-neutral-500">
                Tap on up to 2 available seats or wheelchair bays
              </span>
            )}
          </div>

          {/* ============================================================== */}
          {/* USER SPEC: AUTO-FILLED ACCOUNT INFORMATION                     */}
          {/* ============================================================== */}
          <div className="rounded-2xl bg-orange-50/70 border border-orange-200 p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-[#F37021] text-white flex items-center justify-center font-bold">
                <User className="h-4 w-4" />
              </div>
              <div>
                <p className="font-extrabold text-neutral-900 leading-tight">
                  {passengerName}
                </p>
                <p className="text-[11px] font-mono text-neutral-600">
                  OKU: {okuId} · {phone}
                </p>
              </div>
            </div>
            <span className="rounded-md bg-orange-100 text-orange-950 border border-orange-300 font-bold px-2 py-0.5 text-[10px]">
              {mobilityType}
            </span>
          </div>

          {/* ============================================================== */}
          {/* USER SPEC: PICKUP ADDRESS AUTO-FILLED FROM ACCOUNT INFO        */}
          {/* ============================================================== */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-neutral-700 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[#F37021]" />
                Pickup Address
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoLocate}
                  className="text-[10px] font-bold text-[#F37021] hover:text-[#D9530F] flex items-center gap-0.5"
                >
                  <Locate className="h-2.5 w-2.5" />
                  Auto-Locate GPS
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingPickup(!isEditingPickup)}
                  className="text-[10px] font-bold text-neutral-500 hover:text-black underline"
                >
                  {isEditingPickup ? 'Done' : 'Edit'}
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
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-900 truncate pr-2">
                  {pickupAddress}
                </span>
                <span className="shrink-0 text-[10px] font-bold bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded-sm">
                  Account Default
                </span>
              </div>
            )}
          </div>

          {/* DESTINATION INPUT (DIRECT, REWRITABLE & RESELECTABLE) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-[#F37021]" />
              Destination Hospital / Medical Facility
            </label>

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
                    if (destSuggestions.length > 0) setShowDestDropdown(true);
                  }}
                  placeholder="Type or search hospital or clinic destination..."
                  className="apple-input w-full pl-10 pr-4 text-xs font-medium"
                />
                {isLoadingGeo && (
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#F37021] animate-pulse">
                    Searching...
                  </span>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {showDestDropdown && destSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-2xl border border-neutral-200 bg-white shadow-xl max-h-52 overflow-y-auto divide-y divide-neutral-100">
                  {destSuggestions.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectDestination(item)}
                      className="p-3 hover:bg-orange-50/70 cursor-pointer text-xs transition-colors flex items-start gap-2.5"
                    >
                      <MapPin className="h-4 w-4 text-[#F37021] shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-neutral-900 truncate">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-neutral-500 truncate">
                          {item.display_name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={selectedSeats.length === 0 || !destQuery.trim()}
              className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md tap-target transition-all active:scale-[0.99] ${
                selectedSeats.length === 0 || !destQuery.trim()
                  ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed shadow-none'
                  : 'bg-[#F37021] hover:bg-[#D9530F] text-white'
              }`}
            >
              {t('vanModal.confirmBooking', 'Confirm & Submit Booking')} ({selectedSeats.length} {selectedSeats.length === 1 ? 'Seat' : 'Seats'}) · {selectedTimeSlot}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
