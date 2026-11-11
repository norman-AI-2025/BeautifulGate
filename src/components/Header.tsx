'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { LogOut, User, Shield, Car, HeartHandshake } from 'lucide-react';
import { UserRole } from '@/types';
import { ProfileModal } from '@/components/ProfileModal';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useApp();
  const { t } = useLanguage();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8 py-2.5">
        {/* Brand */}
        <div className="flex items-center gap-4 sm:gap-6">
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
              <span className="text-base font-black tracking-tight text-neutral-900">
                {t('brand.name', 'Beautiful Gate')}
              </span>
              <span className="hidden sm:inline-block rounded-full bg-orange-50 text-[#F37021] border border-orange-200 px-2 py-0.5 text-[10px] font-black tracking-wider uppercase">
                {t('brand.subtitle', 'Assisted Mobility')}
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
              {t('nav.portal', 'Beneficiary Portal')}
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
              {t('nav.driver', 'Driver Console')}
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
              {t('nav.admin', 'Control Tower')}
            </Link>
          </nav>
        </div>

        {/* Right Section: User Profile & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* User Session Info */}
          {currentUser ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Profile Card Button (Click to Edit Profile) */}
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-2.5 p-1 rounded-2xl hover:bg-neutral-100 transition-all tap-target text-left group"
                title={t('profile.editMyProfile', 'Click to edit your profile and photo')}
              >
                <div className="relative h-9 w-9 rounded-full overflow-hidden bg-orange-100 border-2 border-neutral-200 shadow-xs flex items-center justify-center shrink-0 group-hover:border-[#F37021] transition-colors">
                  {currentUser.avatar_url ? (
                    <Image
                      src={currentUser.avatar_url}
                      alt={currentUser.full_name}
                      width={36}
                      height={36}
                      className="h-full w-full object-cover"
                      unoptimized={currentUser.avatar_url.startsWith('data:')}
                    />
                  ) : (
                    <span className="font-extrabold text-xs text-[#F37021]">
                      {(currentUser.full_name?.charAt(0) || 'U').toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="text-right hidden sm:block">
                  <p className="text-xs font-black text-neutral-900 leading-tight group-hover:text-[#F37021] transition-colors">
                    {currentUser.full_name}
                  </p>
                  <div className="flex items-center justify-end gap-1.5 mt-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                      {currentUser.role === 'customer'
                        ? t('auth.beneficiaryRole', 'Beneficiary')
                        : currentUser.role === 'driver'
                        ? t('auth.driverStaffRole', 'Driver')
                        : t('nav.supervisorRole', 'Supervisor')}
                    </span>
                    <span className="text-neutral-300">•</span>
                    <span className="text-[10px] font-mono text-neutral-500">
                      {currentUser.ic_or_oku_number}
                    </span>
                  </div>
                </div>
              </button>

              {/* Sign Out Button */}
              <button
                onClick={handleLogout}
                className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 hover:text-black transition-colors tap-target"
                title={t('nav.signOut', 'Sign Out')}
                aria-label={t('nav.signOut', 'Sign Out')}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="apple-btn-primary text-xs px-3 sm:px-4 py-1.5 sm:py-2"
            >
              <User className="h-3.5 w-3.5 mr-1" />
              {t('nav.signIn', 'Sign In')}
            </Link>
          )}
        </div>
      </div>

      {/* User Profile Modal */}
      {isProfileModalOpen && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          mode="edit_self"
        />
      )}
    </header>
  );
};

