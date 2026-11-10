'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Lock, 
  Armchair, 
  Accessibility, 
  Search, 
  MapPin, 
  Locate, 
  Check, 
  User, 
  Phone, 
  CreditCard 
} from 'lucide-react';
import { AssignedSpace, MobilityType, TransitBooking } from '@/types';
import { useApp } from '@/context/AppContext';

interface VanFloorPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTimeSlot: string;
  selectedDay?: string;
  existingBookingsForSlot: TransitBooking[];
  onBookingSuccess: (bookingId: string) => void;
}

const PICKUP_SUGGESTIONS = [
  'Current Location: SS 2/19, Petaling Jaya',
  'No. 18, Jalan SS 2/19, 47300 Petaling Jaya',
  'Beautiful Gate Foundation, Kepong, Kuala Lumpur',
  'Block C-04-12, PPR Taman Medan, 46000 Petaling Jaya',
  'No. 45, Lorong Maarof, Bangsar, 59000 Kuala Lumpur',
  '22, Jalan Bukit Segambut, 51200 Kuala Lumpur',
  'PPR Lembah Subang 1, 47301 Petaling Jaya',
  'Seksyen 14, 46100 Petaling Jaya, Selangor',
  'Taman Megah, 47301 Petaling Jaya',
  'PPR Kampung Muhibbah, Bukit Jalil, KL',
];

const DESTINATION_SUGGESTIONS = [
  "Hospital Tuanku Ja'afar (HTJ), Seremban",
  'Hospital Kuala Lumpur (HKL), Jalan Pahang',
  'University Malaya Medical Centre (PPUM), Petaling Jaya',
  'Hospital Sultan Idris Shah, Serdang',
  'Hospital Selayang, Lebuhraya Selayang-Kepong',
  'Hospital Sungai Buloh, Selangor',
  'Hospital Shah Alam, Seksyen 7',
  'National Heart Institute (IJN), Kuala Lumpur',
  'Hospital Ampang, Pandan Mewah',
  'Hospital Tengku Ampuan Rahimah (HTAR), Klang',
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

  const [selectedSeat, setSelectedSeat] = useState<AssignedSpace | null>(null);

  // Address search states & suggestion dropdowns
  const [pickupAddress, setPickupAddress] = useState(
    'No. 18, Jalan SS 2/19, 47300 Petaling Jaya'
  );
  const [pickupQuery, setPickupQuery] = useState(pickupAddress);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);

  const [destination, setDestination] = useState(
    "Hospital Tuanku Ja'afar (HTJ), Seremban"
  );
  const [destQuery, setDestQuery] = useState(destination);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');

  // Auto-filled account info from logged-in user
  const passengerName = currentUser?.full_name || 'Siti Nurhaliza binti Mansor';
  const okuId = currentUser?.ic_or_oku_number || 'DE0502198901';
  const phone = currentUser?.phone || '+60 12-491 8832';
  const mobilityType = currentUser?.mobility_type || 'Manual Wheelchair';

  if (!isOpen) return null;

  // Calculate occupied spaces for this time slot
  const occupiedSpaces = new Set(
    existingBookingsForSlot
      .filter(b => b.status !== 'declined')
      .map(b => b.assigned_space)
  );

  const handleSeatClick = (seat: AssignedSpace) => {
    if (occupiedSpaces.has(seat)) return;
    setSelectedSeat(seat);
    setErrorMsg('');
  };

  const filteredPickups = PICKUP_SUGGESTIONS.filter(item =>
    item.toLowerCase().includes(pickupQuery.toLowerCase())
  );

  const filteredDests = DESTINATION_SUGGESTIONS.filter(item =>
    item.toLowerCase().includes(destQuery.toLowerCase())
  );

  const handleSelectPickup = (val: string) => {
    setPickupAddress(val);
    setPickupQuery(val);
    setShowPickupSuggestions(false);
  };

  const handleSelectDest = (val: string) => {
    setDestination(val);
    setDestQuery(val);
    setShowDestSuggestions(false);
  };

  const handleAutoLocate = () => {
    const loc = 'Current GPS: No. 18, Jalan SS 2/19, Petaling Jaya';
    setPickupAddress(loc);
    setPickupQuery(loc);
    setShowPickupSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeat) {
      setErrorMsg('Please select a seat icon on the van floor plan.');
      return;
    }
    if (!pickupQuery.trim()) {
      setErrorMsg('Please specify a pickup address.');
      return;
    }
    if (!destQuery.trim()) {
      setErrorMsg('Please specify a destination.');
      return;
    }

    const newBooking = createBooking({
      appointment_time: selectedTimeSlot,
      date: selectedDay,
      assigned_space: selectedSeat,
      pickup_address: pickupQuery,
      hospital_name: destQuery,
      clinic_department: 'Hospital Accessible Transit',
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
      <div className="relative w-full max-w-2xl rounded-3xl bg-white border border-neutral-200 shadow-2xl my-6 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3.5 bg-neutral-50/80">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-neutral-900">
              Seat Selection
            </h2>
            <span className="rounded-md bg-teal-800 text-white px-2 py-0.5 text-xs font-bold">
              {selectedDay.split(',')[0]}
            </span>
            <span className="rounded-md bg-cyan-100 text-cyan-950 border border-cyan-300 px-2 py-0.5 font-mono text-xs font-black">
              {selectedTimeSlot}
            </span>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:text-black hover:bg-neutral-200 transition-colors tap-target"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
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
            <div className="flex items-center gap-4 text-[11px] font-bold text-neutral-500 mb-3">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-md border-2 border-neutral-300 bg-white" />
                Available
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-md bg-teal-800" />
                Selected
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-md bg-neutral-300" />
                Occupied
              </span>
            </div>

            {/* Van Outer Body Shape */}
            <div className="relative w-64 rounded-t-[50px] rounded-b-[28px] border-2 border-neutral-800 bg-neutral-100/80 p-3.5 shadow-md">
              {/* Left & Right Side Mirrors */}
              <div className="absolute -left-2 top-14 h-4 w-2 rounded-l-md bg-neutral-800" />
              <div className="absolute -right-2 top-14 h-4 w-2 rounded-r-md bg-neutral-800" />

              {/* Front Hood & Curved Windshield */}
              <div className="mb-3 text-center">
                <div className="mx-auto h-1 w-12 rounded-full bg-neutral-400 mb-1" />
                <div className="h-4 w-full rounded-t-[28px] border-b-2 border-neutral-400 bg-cyan-900/10" />
              </div>

              {/* ROW 1: Driver (Fixed) & Front Passenger */}
              <div className="mb-2.5 grid grid-cols-2 gap-3 px-1">
                {/* Driver (Locked) */}
                <div
                  className="h-11 rounded-xl bg-neutral-200 border border-neutral-300 flex items-center justify-center text-neutral-400"
                  title="Operator Driver Seat (Fixed)"
                >
                  <Lock className="h-4 w-4" />
                </div>

                {/* Front Passenger Seat */}
                {(() => {
                  const spaceName: AssignedSpace = 'Row 1: Front Passenger Seat';
                  const isOccupied = occupiedSpaces.has(spaceName);
                  const isSelected = selectedSeat === spaceName;

                  return (
                    <button
                      type="button"
                      disabled={isOccupied}
                      onClick={() => handleSeatClick(spaceName)}
                      className={`h-11 rounded-xl flex items-center justify-center transition-all tap-target border-2 ${
                        isSelected
                          ? 'bg-teal-800 text-white border-teal-800 shadow-md scale-105'
                          : isOccupied
                          ? 'bg-neutral-200 text-neutral-400 border-neutral-300 cursor-not-allowed'
                          : 'bg-white text-neutral-800 border-neutral-300 hover:border-teal-700 hover:scale-105'
                      }`}
                      title={spaceName}
                    >
                      <Armchair className="h-5 w-5" />
                    </button>
                  );
                })()}
              </div>

              {/* ROW 2: 4 Regular Passenger Seats */}
              <div className="mb-2.5 grid grid-cols-4 gap-1.5 px-1">
                {(['Row 2: Passenger Seat 1', 'Row 2: Passenger Seat 2', 'Row 2: Passenger Seat 3', 'Row 2: Passenger Seat 4'] as AssignedSpace[]).map((spaceName) => {
                  const isOccupied = occupiedSpaces.has(spaceName);
                  const isSelected = selectedSeat === spaceName;

                  return (
                    <button
                      key={spaceName}
                      type="button"
                      disabled={isOccupied}
                      onClick={() => handleSeatClick(spaceName)}
                      className={`h-10 rounded-xl flex items-center justify-center transition-all tap-target border-2 ${
                        isSelected
                          ? 'bg-teal-800 text-white border-teal-800 shadow-md scale-105'
                          : isOccupied
                          ? 'bg-neutral-200 text-neutral-400 border-neutral-300 cursor-not-allowed'
                          : 'bg-white text-neutral-800 border-neutral-300 hover:border-teal-700 hover:scale-105'
                      }`}
                      title={spaceName}
                    >
                      <Armchair className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>

              {/* ROW 3: 2 Wheelchair Bays */}
              <div className="grid grid-cols-2 gap-3 px-1 pt-1 border-t border-dashed border-neutral-300">
                {(['Row 3: Wheelchair Bay 1', 'Row 3: Wheelchair Bay 2'] as AssignedSpace[]).map((spaceName) => {
                  const isOccupied = occupiedSpaces.has(spaceName);
                  const isSelected = selectedSeat === spaceName;

                  return (
                    <button
                      key={spaceName}
                      type="button"
                      disabled={isOccupied}
                      onClick={() => handleSeatClick(spaceName)}
                      className={`h-12 rounded-xl flex items-center justify-center transition-all tap-target border-2 ${
                        isSelected
                          ? 'bg-teal-800 text-white border-teal-800 shadow-md scale-105'
                          : isOccupied
                          ? 'bg-neutral-200 text-neutral-400 border-neutral-300 cursor-not-allowed'
                          : 'bg-white text-neutral-800 border-neutral-300 hover:border-teal-700 hover:scale-105'
                      }`}
                      title={`${spaceName} (Floor Clamps Equipped)`}
                    >
                      <Accessibility className="h-6 w-6 stroke-[2]" />
                    </button>
                  );
                })}
              </div>

              {/* Rear Hydraulic Lift Door Indicator */}
              <div className="mt-2.5 flex items-center justify-center gap-1.5 pt-1.5 border-t border-neutral-300">
                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-600">
                  Rear Hydraulic Ramp
                </span>
              </div>
            </div>

            {/* Selected Seat Indicator */}
            <div className="mt-2.5 text-center">
              {selectedSeat ? (
                <span className="inline-block text-xs font-bold text-teal-900 bg-teal-50 border border-teal-300 px-3 py-1 rounded-full">
                  Selected: {selectedSeat}
                </span>
              ) : (
                <span className="text-xs text-neutral-400 font-medium">
                  Tap any available seat or wheelchair bay icon
                </span>
              )}
            </div>
          </div>

          {/* ============================================================== */}
          {/* AUTO-FILLED ACCOUNT INFO                                      */}
          {/* ============================================================== */}
          <div className="rounded-2xl bg-neutral-50 border border-neutral-200 p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold">
                <User className="h-4 w-4" />
              </div>
              <div>
                <p className="font-extrabold text-neutral-900 leading-tight">
                  {passengerName}
                </p>
                <p className="text-[11px] font-mono text-neutral-500">
                  {okuId} · {phone}
                </p>
              </div>
            </div>
            <span className="rounded-lg bg-teal-100 text-teal-900 border border-teal-200 px-2 py-0.5 text-[10px] font-bold">
              {mobilityType}
            </span>
          </div>

          {/* ============================================================== */}
          {/* SEARCH BARS: PICKUP ADDRESS & DESTINATION WITH AUTO-SUGGEST   */}
          {/* ============================================================== */}
          <div className="space-y-3.5">
            {/* Pickup Address Search Bar */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-neutral-700">
                  Pickup Address
                </label>
                <button
                  type="button"
                  onClick={handleAutoLocate}
                  className="flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-900"
                >
                  <Locate className="h-3 w-3" />
                  Auto-Locate GPS
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  required
                  value={pickupQuery}
                  onChange={(e) => {
                    setPickupQuery(e.target.value);
                    setShowPickupSuggestions(true);
                  }}
                  onFocus={() => setShowPickupSuggestions(true)}
                  placeholder="Search pickup address..."
                  className="apple-input w-full pl-10 pr-4 text-xs font-medium"
                />
              </div>

              {/* Autocomplete Suggestion Dropdown */}
              {showPickupSuggestions && filteredPickups.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-2xl border border-neutral-200 bg-white shadow-xl max-h-48 overflow-y-auto divide-y divide-neutral-100">
                  {filteredPickups.map((loc) => (
                    <div
                      key={loc}
                      onClick={() => handleSelectPickup(loc)}
                      className="p-2.5 flex items-center gap-2 hover:bg-teal-50 cursor-pointer text-xs font-semibold text-neutral-800 transition-colors"
                    >
                      <MapPin className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                      <span className="truncate">{loc}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Destination Search Bar (Department removed as requested!) */}
            <div className="relative">
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Destination Hospital / Medical Facility
              </label>

              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  required
                  value={destQuery}
                  onChange={(e) => {
                    setDestQuery(e.target.value);
                    setShowDestSuggestions(true);
                  }}
                  onFocus={() => setShowDestSuggestions(true)}
                  placeholder="Search hospital or clinic destination..."
                  className="apple-input w-full pl-10 pr-4 text-xs font-medium"
                />
              </div>

              {/* Destination Suggestion Dropdown */}
              {showDestSuggestions && filteredDests.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-2xl border border-neutral-200 bg-white shadow-xl max-h-48 overflow-y-auto divide-y divide-neutral-100">
                  {filteredDests.map((hosp) => (
                    <div
                      key={hosp}
                      onClick={() => handleSelectDest(hosp)}
                      className="p-2.5 flex items-center gap-2 hover:bg-teal-50 cursor-pointer text-xs font-semibold text-neutral-800 transition-colors"
                    >
                      <MapPin className="h-3.5 w-3.5 text-cyan-700 shrink-0" />
                      <span className="truncate">{hosp}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={!selectedSeat}
              className={`w-full py-3 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-md tap-target transition-all ${
                !selectedSeat
                  ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed shadow-none'
                  : 'bg-teal-800 hover:bg-teal-900 text-white'
              }`}
            >
              Confirm Van Booking · {selectedTimeSlot}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
