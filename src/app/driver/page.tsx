'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { DriverStateController } from '@/components/DriverStateController';
import { 
  Phone, 
  MessageSquare, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  Car,
  ChevronRight,
  ChevronDown,
  Navigation,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { TransitBooking } from '@/types';

export default function DriverPage() {
  const { bookings } = useApp();

  // Active bookings assigned to Driver Johan that are not declined
  const queueBookings = bookings.filter(b => 
    b.status !== 'declined' && b.assigned_driver === 'Johan bin Ariffin'
  );

  // Active mission state (can be expanded from the queue list)
  const [activeExpandedId, setActiveExpandedId] = useState<string | null>(
    queueBookings.find(b => ['en_route_pickup', 'picked_up', 'en_route_hospital'].includes(b.status))?.id || 
    queueBookings[0]?.id || 
    null
  );

  const activeBooking = queueBookings.find(b => b.id === activeExpandedId) || queueBookings[0];

  const handlePromoteNext = () => {
    const next = queueBookings.find(b => 
      b.id !== activeBooking?.id && (b.status === 'approved' || b.status === 'pending')
    );
    if (next) {
      setActiveExpandedId(next.id);
    }
  };

  // Helper to check if a booking is within 15 mins or active
  const isWithin15MinutesOrActive = (b: TransitBooking, idx: number) => {
    // If it's already active or the first upcoming ride, highlight in green
    if (['en_route_pickup', 'picked_up', 'en_route_hospital'].includes(b.status)) return true;
    if (b.status === 'approved' && idx === 0) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-neutral-900 pb-28">
      {/* Driver Mobile Header */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-cyan-900 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-xl mx-auto px-4 py-3.5 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400 text-teal-950 font-black shadow-sm">
                <Car className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-extrabold">Driver Console</h1>
                  <span className="rounded-md bg-cyan-400 text-teal-950 px-2 py-0.5 text-xs font-mono font-black">
                    WVV 4108
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300 block">
                Today&apos;s Runs
              </span>
              <span className="text-xs font-extrabold text-white">
                {queueBookings.length} Pickups Assigned
              </span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-xl mx-auto px-4 pt-5 sm:px-6 space-y-6">
        {/* ============================================================== */}
        {/* 1. FIRST THING TO SHOW: THE QUEUE LIST FOR TODAY               */}
        {/* ============================================================== */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                Scheduled Manifest
              </span>
              <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">
                Today&apos;s Transit Queue List
              </h2>
            </div>
            <span className="text-xs font-bold text-teal-900 bg-teal-100 border border-teal-300 px-3 py-1 rounded-full">
              {queueBookings.length} Trips
            </span>
          </div>

          {/* Queue Items */}
          <div className="space-y-3.5">
            {queueBookings.map((b, idx) => {
              const isGreenAlert = isWithin15MinutesOrActive(b, idx);
              const isExpanded = activeExpandedId === b.id;
              const isCompleted = b.status === 'dropped_off' || b.status === 'en_route_next';

              return (
                <div
                  key={b.id}
                  className={`rounded-3xl transition-all duration-200 overflow-hidden shadow-xs ${
                    isGreenAlert
                      ? 'border-2 border-emerald-500 ring-4 ring-emerald-100 bg-white'
                      : isCompleted
                      ? 'border border-neutral-200 bg-neutral-50/80 opacity-90'
                      : 'border-2 border-neutral-200 bg-white hover:border-teal-600'
                  }`}
                >
                  {/* Queue Item Header Bar (Clickable to Expand / Collapse) */}
                  <div
                    onClick={() => setActiveExpandedId(isExpanded ? null : b.id)}
                    className="p-4 sm:p-5 cursor-pointer flex items-center justify-between gap-3 tap-target"
                  >
                    <div className="flex-1 pr-2">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-black text-teal-950 bg-cyan-100 border border-cyan-300 px-2.5 py-0.5 rounded-lg">
                          {b.appointment_time}
                        </span>

                        {isGreenAlert && !isCompleted && (
                          <span className="text-[10px] font-extrabold uppercase tracking-wide bg-emerald-600 text-white px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                            Ready · Within 15 Mins
                          </span>
                        )}

                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                          {b.assigned_space}
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-neutral-900">
                        {b.passenger_name}
                      </h3>

                      <p className="text-xs font-semibold text-neutral-600 mt-0.5">
                        {b.hospital_name} · {b.clinic_department}
                      </p>

                      <p className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 text-neutral-400 shrink-0" />
                        {b.pickup_address}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-md whitespace-nowrap ${
                        isCompleted
                          ? 'bg-neutral-200 text-neutral-600'
                          : b.status === 'en_route_pickup' || b.status === 'picked_up' || b.status === 'en_route_hospital'
                          ? 'bg-teal-900 text-white'
                          : 'bg-emerald-100 text-emerald-900 font-extrabold'
                      }`}>
                        {b.status.replace(/_/g, ' ')}
                      </span>

                      <div className="flex items-center text-xs font-bold text-teal-800 gap-1">
                        <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ============================================================== */}
                  {/* 2. EXPANDED MISSION CONTROLS (WHEN DRIVER CLICKS QUEUE ITEM)   */}
                  {/* ============================================================== */}
                  {isExpanded && (
                    <div className="border-t-2 border-neutral-100 bg-gradient-to-b from-neutral-50/70 to-white p-4 sm:p-6 space-y-5">
                      <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80">
                        <span className="text-xs font-bold uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                          <Navigation className="h-4 w-4 text-teal-700" />
                          Active Mission Transit Controls
                        </span>
                        <span className="font-mono text-xs font-bold text-neutral-600">
                          OKU: {b.oku_id}
                        </span>
                      </div>

                      {/* Mobility & Destination Summary */}
                      <div className="rounded-2xl border border-neutral-200 bg-white p-4 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-neutral-500 font-medium">Passenger Mobility:</span>
                          <span className="font-bold text-neutral-900">{b.mobility_type}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs border-t border-neutral-100 pt-2">
                          <span className="text-neutral-500 font-medium">Allocated Van Space:</span>
                          <span className="font-bold text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-mono">
                            {b.assigned_space}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs border-t border-neutral-100 pt-2">
                          <span className="text-neutral-500 font-medium">Pickup Contact:</span>
                          <span className="font-bold font-mono text-neutral-900">{b.phone}</span>
                        </div>
                      </div>

                      {/* Quick Contact Buttons (Call & WhatsApp) */}
                      <div className="grid grid-cols-2 gap-3">
                        <a
                          href={`tel:${b.phone}`}
                          className="apple-btn-secondary text-xs font-bold flex items-center justify-center gap-2 tap-target bg-white hover:bg-neutral-100"
                        >
                          <Phone className="h-4 w-4 text-emerald-700" />
                          Call Passenger
                        </a>
                        <a
                          href={`https://wa.me/${b.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="apple-btn-secondary text-xs font-bold flex items-center justify-center gap-2 tap-target bg-white hover:bg-neutral-100"
                        >
                          <MessageSquare className="h-4 w-4 text-teal-700" />
                          WhatsApp
                        </a>
                      </div>

                      {/* Sequential Single-Button State Machine */}
                      <div className="pt-2">
                        <DriverStateController
                          currentBooking={b}
                          onPromoteNext={handlePromoteNext}
                          hasNextBooking={queueBookings.filter(q => q.id !== b.id && q.status !== 'dropped_off').length > 0}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
