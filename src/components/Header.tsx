'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { LogOut, User, Shield, Car, HeartHandshake } from 'lucide-react';
import { UserRole } from '@/types';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, switchRole, logout } = useApp();

  const handleRoleSwitch = (role: UserRole) => {
    switchRole(role);
    if (role === 'customer') router.push('/portal');
    else if (role === 'driver') router.push('/driver');
    else if (role === 'admin') router.push('/admin');
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative h-10 w-10 shrink-0">
              <Image 
                src="/images/beautiful-gate-logo.png" 
                alt="Beautiful Gate Foundation" 
                width={40} 
                height={40} 
                className="h-10 w-10 object-contain"
                priority
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-neutral-900">Beautiful Gate</span>
              <span className="rounded-full bg-orange-50 text-[#F37021] border border-orange-200 px-2 py-0.5 text-[10px] font-black tracking-wider uppercase">
                Assisted Mobility
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-neutral-200">
            <Link
              href="/portal"
              className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all tap-target flex items-center gap-1.5 ${
                pathname === '/portal'
                  ? 'bg-[#F37021] text-white shadow-xs'
                  : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
              }`}
            >
              <HeartHandshake className="h-4 w-4" />
              Beneficiary Portal
            </Link>

            <Link
              href="/driver"
              className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all tap-target flex items-center gap-1.5 ${
                pathname === '/driver'
                  ? 'bg-[#F37021] text-white shadow-xs'
                  : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
              }`}
            >
              <Car className="h-4 w-4" />
              Driver Console
            </Link>

            <Link
              href="/admin"
              className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all tap-target flex items-center gap-1.5 ${
                pathname === '/admin'
                  ? 'bg-[#F37021] text-white shadow-xs'
                  : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
              }`}
            >
              <Shield className="h-4 w-4" />
              Control Tower
            </Link>
          </nav>
        </div>

        {/* Right Section: Quick Switcher & User Profile */}
        <div className="flex items-center gap-3">
          {/* Quick Demo Switcher Pill */}
          <div className="hidden lg:flex items-center rounded-full bg-neutral-100 p-1 border border-neutral-200 text-xs">
            <button
              onClick={() => handleRoleSwitch('customer')}
              className={`rounded-full px-3 py-1 font-medium transition-all tap-target flex items-center ${
                currentUser?.role === 'customer'
                  ? 'bg-white text-black shadow-xs font-semibold'
                  : 'text-neutral-600 hover:text-black'
              }`}
              title="Test as Siti Nurhaliza"
            >
              Artisan
            </button>
            <button
              onClick={() => handleRoleSwitch('driver')}
              className={`rounded-full px-3 py-1 font-medium transition-all tap-target flex items-center ${
                currentUser?.role === 'driver'
                  ? 'bg-white text-black shadow-xs font-semibold'
                  : 'text-neutral-600 hover:text-black'
              }`}
              title="Test as Johan bin Ariffin"
            >
              Driver
            </button>
            <button
              onClick={() => handleRoleSwitch('admin')}
              className={`rounded-full px-3 py-1 font-medium transition-all tap-target flex items-center ${
                currentUser?.role === 'admin'
                  ? 'bg-white text-black shadow-xs font-semibold'
                  : 'text-neutral-600 hover:text-black'
              }`}
              title="Test as Faridah binti Hashim"
            >
              Supervisor
            </button>
          </div>

          {/* User Session Info */}
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-neutral-900 leading-tight">
                  {currentUser.full_name}
                </p>
                <div className="flex items-center justify-end gap-1.5">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                    {currentUser.role === 'customer'
                      ? 'Beneficiary'
                      : currentUser.role === 'driver'
                      ? 'Driver'
                      : 'Supervisor'}
                  </span>
                  <span className="text-neutral-300">•</span>
                  <span className="text-[11px] font-mono text-neutral-500">
                    {currentUser.ic_or_oku_number}
                  </span>
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={handleLogout}
                className="flex items-center justify-center h-10 w-10 rounded-full border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 hover:text-black transition-colors tap-target"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="apple-btn-primary text-xs px-4 py-2"
            >
              <User className="h-3.5 w-3.5 mr-1.5" />
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

