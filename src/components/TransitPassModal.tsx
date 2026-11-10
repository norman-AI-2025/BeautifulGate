'use client';

import React from 'react';
import { X, QrCode, ShieldCheck, Printer, Car, MapPin, User, Calendar } from 'lucide-react';
import { TransitBooking } from '@/types';

interface TransitPassModalProps {
  booking: TransitBooking;
  onClose: () => void;
}

export const TransitPassModal: React.FC<TransitPassModalProps> = ({ booking, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md rounded-3xl bg-white border border-neutral-200 shadow-2xl overflow-hidden my-8">
        {/* Pass Top Card (Apple Wallet Style with Beautiful Gate Branding) */}
        <div className="bg-gradient-to-br from-neutral-950 via-stone-900 to-orange-950 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-neutral-300 hover:text-white transition-colors tap-target"
            aria-label="Close pass"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 mb-4">
            <span className="font-extrabold text-sm tracking-tight text-[#F37021]">BEAUTIFUL GATE</span>
            <span className="text-[10px] uppercase font-mono tracking-widest text-orange-200 border border-orange-500/40 bg-orange-500/10 px-2 py-0.5 rounded-full">
              Transit Pass
            </span>
          </div>

          <p className="text-xs text-orange-200 uppercase tracking-wider font-semibold">
            Destination Facility
          </p>
          <h3 className="text-2xl font-extrabold tracking-tight mt-0.5">
            {booking.hospital_name}
          </h3>
          <p className="text-xs text-neutral-300 font-medium">
            {booking.clinic_department}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
            <div>
              <p className="text-[10px] text-orange-200 uppercase tracking-widest">
                Appointment Time
              </p>
              <p className="text-xl font-bold font-mono text-white mt-0.5">
                {booking.appointment_time}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-orange-200 uppercase tracking-widest">
                Allocated Space
              </p>
              <p className="text-xs font-bold text-white mt-1 truncate">
                {booking.assigned_space}
              </p>
            </div>
          </div>
        </div>

        {/* Perforated Notch Divider */}
        <div className="relative h-6 bg-white flex items-center justify-between">
          <div className="w-4 h-6 bg-black/60 rounded-r-full -ml-1" />
          <div className="flex-1 border-b-2 border-dashed border-neutral-300 mx-2" />
          <div className="w-4 h-6 bg-black/60 rounded-l-full -mr-1" />
        </div>

        {/* Pass Bottom Card (Passenger & Vehicle Specs) */}
        <div className="p-6 bg-white space-y-4">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                Passenger Name
              </p>
              <p className="font-bold text-neutral-900 text-sm mt-0.5">
                {booking.passenger_name}
              </p>
              <p className="font-mono text-neutral-500 text-[11px]">
                OKU: {booking.oku_id}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                Assigned Vehicle
              </p>
              <p className="font-bold text-neutral-900 text-sm mt-0.5">
                {booking.assigned_vehicle.plate}
              </p>
              <p className="text-neutral-500 text-[11px]">
                {booking.assigned_vehicle.model}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs space-y-1">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              Pickup Residence
            </p>
            <p className="font-semibold text-neutral-800 text-[11px] leading-snug">
              {booking.pickup_address}
            </p>
          </div>

          {/* Barcode & Verification Badge */}
          <div className="pt-2 text-center border-t border-neutral-100">
            <div className="mx-auto w-48 h-10 flex items-center justify-center space-x-1 opacity-80 mb-2">
              <div className="h-full w-1 bg-black" />
              <div className="h-full w-0.5 bg-black" />
              <div className="h-full w-2 bg-black" />
              <div className="h-full w-0.5 bg-black" />
              <div className="h-full w-1.5 bg-black" />
              <div className="h-full w-0.5 bg-black" />
              <div className="h-full w-2.5 bg-black" />
              <div className="h-full w-1 bg-black" />
              <div className="h-full w-0.5 bg-black" />
              <div className="h-full w-1.5 bg-black" />
              <div className="h-full w-2 bg-black" />
              <div className="h-full w-0.5 bg-black" />
              <div className="h-full w-1 bg-black" />
              <div className="h-full w-2 bg-black" />
            </div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
              PASS-{booking.id.toUpperCase()} · VERIFIED OPERATOR DISPATCH
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="apple-btn-secondary w-full text-xs font-bold gap-2 mt-2 tap-target"
          >
            <Printer className="h-3.5 w-3.5" />
            Print or Save Digital Pass
          </button>
        </div>
      </div>
    </div>
  );
};

