'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { 
  HeartHandshake, 
  Car, 
  Shield, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Calendar,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { UserRole } from '@/types';

export default function HomePage() {
  const { currentUser, switchRole } = useApp();

  const handleLaunchRole = (role: UserRole) => {
    switchRole(role);
  };

  return (
    <div className="min-h-screen bg-[#fbfbfd] text-neutral-900 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-24 border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-100 px-3.5 py-1 text-xs font-semibold text-neutral-700 mb-6">
            <span className="h-2 w-2 rounded-full bg-neutral-900" />
            Beautiful Gate Foundation for the Disabled
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-neutral-900 leading-[1.1]">
            Assisted Mobility &<br className="hidden sm:inline" /> Artisan Workshop Platform
          </h1>

          {/* Quick Launch CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/portal"
              onClick={() => handleLaunchRole('customer')}
              className="px-6 py-3.5 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white font-extrabold text-sm shadow-md flex items-center tap-target"
            >
              <HeartHandshake className="h-4 w-4 mr-2" />
              Launch Beneficiary Portal
            </Link>

            <Link
              href="/driver"
              onClick={() => handleLaunchRole('driver')}
              className="px-6 py-3.5 rounded-2xl bg-cyan-100 hover:bg-cyan-200 text-teal-950 font-extrabold text-sm border border-cyan-300 shadow-xs flex items-center tap-target"
            >
              <Car className="h-4 w-4 mr-2 text-teal-800" />
              Driver Console
            </Link>

            <Link
              href="/admin"
              onClick={() => handleLaunchRole('admin')}
              className="px-6 py-3.5 rounded-2xl bg-white hover:bg-neutral-100 text-neutral-800 font-extrabold text-sm border border-neutral-300 shadow-xs flex items-center tap-target"
            >
              <Shield className="h-4 w-4 mr-2 text-teal-800" />
              Supervisor Control Tower
            </Link>
          </div>
        </div>
      </section>

      {/* 3 Core Architecture Modules */}
      <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center sm:text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Engineered Subsystems
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 mt-1">
            Integrated Mobility & Artisan Workflows
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Beneficiary Portal */}
          <div className="rounded-3xl border border-neutral-200 bg-white p-7 shadow-xs flex flex-col justify-between hover:border-teal-700 transition-all group">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-800 mb-6 group-hover:bg-teal-800 group-hover:text-white transition-colors">
                <HeartHandshake className="h-6 w-6 stroke-[2]" />
              </div>
              <h3 className="text-xl font-extrabold tracking-tight text-neutral-900">
                Beneficiary Portal
              </h3>
            </div>

            <div className="pt-6 mt-6 border-t border-neutral-100">
              <Link
                href="/portal"
                onClick={() => handleLaunchRole('customer')}
                className="w-full py-3 px-4 rounded-xl bg-teal-800 text-white text-xs font-bold flex items-center justify-between shadow-xs tap-target"
              >
                <span>Enter as Siti Nurhaliza</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Card 2: Driver Console */}
          <div className="rounded-3xl border border-neutral-200 bg-white p-7 shadow-xs flex flex-col justify-between hover:border-teal-700 transition-all group">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-800 mb-6 group-hover:bg-cyan-800 group-hover:text-white transition-colors">
                <Car className="h-6 w-6 stroke-[2]" />
              </div>
              <h3 className="text-xl font-extrabold tracking-tight text-neutral-900">
                Driver Console
              </h3>
            </div>

            <div className="pt-6 mt-6 border-t border-neutral-100">
              <Link
                href="/driver"
                onClick={() => handleLaunchRole('driver')}
                className="w-full py-3 px-4 rounded-xl bg-cyan-100 text-teal-950 border border-cyan-300 text-xs font-bold flex items-center justify-between shadow-xs tap-target"
              >
                <span>Enter as Johan bin Ariffin</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Card 3: Control Tower */}
          <div className="rounded-3xl border border-neutral-200 bg-white p-7 shadow-xs flex flex-col justify-between hover:border-teal-700 transition-all group">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-800 mb-6 group-hover:bg-neutral-900 group-hover:text-white transition-colors">
                <Shield className="h-6 w-6 stroke-[2]" />
              </div>
              <h3 className="text-xl font-extrabold tracking-tight text-neutral-900">
                Supervisor Control Tower
              </h3>
            </div>

            <div className="pt-6 mt-6 border-t border-neutral-100">
              <Link
                href="/admin"
                onClick={() => handleLaunchRole('admin')}
                className="w-full py-3 px-4 rounded-xl bg-white text-neutral-900 border border-neutral-300 text-xs font-bold flex items-center justify-between shadow-xs tap-target"
              >
                <span>Enter as Faridah Hashim</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Fleet Physical Layout Specification Callout */}
      <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-neutral-900 bg-neutral-900 text-white p-8 sm:p-10 shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                Official NGO Vehicle Manifest
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Toyota HiAce High-Roof Commuter
              </h3>
              <p className="text-sm text-neutral-300 leading-relaxed">
                White Pearl · Plate <span className="font-mono font-bold text-white bg-neutral-800 px-2 py-0.5 rounded-sm">WVV 4108</span>. Fitted with heavy-duty wheelchair lock-down floor clamps and rear hydraulic boarding lift.
              </p>

              <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
                <div className="rounded-xl bg-neutral-800 p-3">
                  <p className="text-neutral-400 font-medium">Row 1 Cab</p>
                  <p className="font-bold text-white mt-1">Driver + 1 Pax</p>
                </div>
                <div className="rounded-xl bg-neutral-800 p-3">
                  <p className="text-neutral-400 font-medium">Row 2 Cabin</p>
                  <p className="font-bold text-white mt-1">4 Regular Seats</p>
                </div>
                <div className="rounded-xl bg-neutral-800 p-3">
                  <p className="text-neutral-400 font-medium">Row 3 Rear</p>
                  <p className="font-bold text-white mt-1">2 Wheelchair Bays</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-2xl bg-neutral-800/90 border border-neutral-700 p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-400">Total Seating Capacity</span>
                <span className="font-bold text-white">7 Passengers</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono border-t border-neutral-700/80 pt-2">
                <span className="text-neutral-400">Accessibility Gear</span>
                <span className="font-bold text-white">Hydraulic Lift</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono border-t border-neutral-700/80 pt-2">
                <span className="text-neutral-400">Operating Route</span>
                <span className="font-bold text-white">Hospital Tuanku Ja&apos;afar</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono border-t border-neutral-700/80 pt-2">
                <span className="text-neutral-400">Partner Resorts</span>
                <span className="font-bold text-white">The Datai, Desaru, Pangkor</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
