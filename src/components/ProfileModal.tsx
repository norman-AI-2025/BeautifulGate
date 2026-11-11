'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { 
  X, 
  Camera, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  Building2, 
  Accessibility, 
  Check, 
  ShieldCheck, 
  Car, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  Lock, 
  Trash2 
} from 'lucide-react';
import { Profile, MobilityType, UserRole, BeneficiaryType } from '@/types';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';

export interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetProfile?: Profile | null;
  profile?: Profile | null;
  mode?: 'edit_self' | 'admin_manage_driver' | 'admin_view';
}

const MOBILITY_OPTIONS: MobilityType[] = [
  'Motorized Wheelchair',
  'Manual Wheelchair',
  'Assisted Walk',
  'None',
  'None / Escort',
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  targetProfile,
  profile: explicitProfile,
  mode = 'edit_self',
}) => {
  const { currentUser, profiles, updateProfile } = useApp();
  const { t } = useLanguage();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active profile being edited or viewed (with fallback so modal always pops up)
  const profile = explicitProfile || targetProfile || currentUser || profiles[0] || {
    id: 'user-default',
    full_name: 'Beneficiary User',
    ic_or_oku_number: 'OKU-PENDING',
    phone: '',
    email: 'user@beautifulgate.org.my',
    role: 'customer' as UserRole,
    mobility_type: 'Manual Wheelchair' as MobilityType,
    is_approved: true,
  };

  // Form states
  const [fullName, setFullName] = useState('');
  const [icNumber, setIcNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [mobilityType, setMobilityType] = useState<MobilityType>('Manual Wheelchair');
  const [beneficiaryType, setBeneficiaryType] = useState<BeneficiaryType>('resident');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  // Driver-specific fields
  const [driverLicense, setDriverLicense] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [driverStatus, setDriverStatus] = useState<'active' | 'on_leave' | 'standby'>('active');
  const [isApproved, setIsApproved] = useState(true);
  const [notes, setNotes] = useState('');
  const [avatarError, setAvatarError] = useState(false);

  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isReadOnly = mode === 'admin_view';
  const isDriverManagement = mode === 'admin_manage_driver' || (profile?.role === 'driver');

  // Synchronize when profile changes or modal opens
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setIcNumber(profile.ic_or_oku_number || '');
      setPhone(profile.phone || '');
      setEmail(profile.email || '');
      setAddress(profile.address || '');
      setMobilityType(profile.mobility_type || 'Manual Wheelchair');
      setBeneficiaryType(profile.beneficiary_type || 'resident');
      setEmergencyContact(profile.emergency_contact || '');
      setEmergencyPhone(profile.emergency_phone || '');
      setAvatarUrl(profile.avatar_url);
      setAvatarError(false);
      setDriverLicense(profile.driver_license || '');
      setVehiclePlate(profile.assigned_vehicle_plate || '');
      setDriverStatus(profile.driver_status || 'active');
      setIsApproved(profile.is_approved !== false);
      setNotes(profile.notes || '');
      setErrorMsg('');
      setIsSuccess(false);
    }
  }, [profile, isOpen]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !profile || !mounted) return null;

  // Handle Photo Upload via Local File Reader -> Base64
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg(t('profile.invalidImageType', 'Please select a valid image file (PNG, JPG, WebP).'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(t('profile.imageTooLarge', 'Image size exceeds 5MB limit. Please choose a smaller photo.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatarUrl(result);
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatarUrl(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isReadOnly) {
      onClose();
      return;
    }

    if (!fullName.trim()) {
      setErrorMsg(t('profile.nameRequired', 'Full Name is required.'));
      return;
    }

    const updates: Partial<Profile> = {
      full_name: fullName.trim(),
      ic_or_oku_number: icNumber.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      emergency_contact: emergencyContact.trim(),
      emergency_phone: emergencyPhone.trim(),
      avatar_url: avatarUrl,
    };

    if (profile.role === 'customer') {
      updates.mobility_type = mobilityType;
      updates.beneficiary_type = beneficiaryType;
    }

    if (profile.role === 'driver') {
      updates.driver_license = driverLicense.trim();
      updates.assigned_vehicle_plate = vehiclePlate.trim();
      updates.driver_status = driverStatus;
      updates.is_approved = isApproved;
      updates.notes = notes.trim();
    }

    updateProfile(profile.id, updates);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 900);
  };

  const roleLabel = profile.role === 'customer' 
    ? t('auth.beneficiaryRole', 'Beneficiary')
    : profile.role === 'driver'
    ? t('auth.driverStaffRole', 'Driver')
    : t('nav.supervisorRole', 'Supervisor');

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in-50">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white border border-neutral-200 shadow-2xl overflow-hidden my-4 sm:my-8 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-neutral-950 via-stone-900 to-orange-950 text-white p-5 sm:p-6 relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all tap-target"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
              profile.role === 'driver' 
                ? 'bg-[#F37021] text-white' 
                : profile.role === 'admin'
                ? 'bg-purple-600 text-white'
                : 'bg-emerald-600 text-white'
            }`}>
              {roleLabel}
            </span>
            <span className="font-mono text-xs text-orange-200">
              {profile.ic_or_oku_number}
            </span>
            {profile.chinese_name && (
              <span className="text-xs text-white/90 font-bold bg-white/20 px-2 py-0.5 rounded-full">
                {profile.chinese_name}
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1.5">
            {mode === 'admin_manage_driver'
              ? t('profile.manageDriverTitle', 'Manage Driver Profile')
              : mode === 'admin_view'
              ? t('profile.viewProfileTitle', 'View User Profile')
              : t('profile.editProfileTitle', 'Edit Profile & Photo')}
          </h2>

          <p className="text-xs text-neutral-300 mt-1 max-w-lg">
            {mode === 'admin_manage_driver'
              ? t('profile.adminDriverDesc', 'Update driver vehicle assignment, public service accreditation, and operational duty status.')
              : mode === 'admin_view'
              ? t('profile.adminViewDesc', 'Read-only view of beneficiary registered details and transit accessibility information.')
              : t('profile.editSelfDesc', 'Personalize your profile photo, emergency contacts, and default transit address.')}
          </p>
        </div>

        {/* Read-only / Admin guidance banner */}
        {isReadOnly && (
          <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 flex items-center gap-2 text-xs text-amber-900 font-semibold shrink-0">
            <Lock className="h-3.5 w-3.5 text-amber-700 shrink-0" />
            <span>{t('profile.readOnlyNotice', 'Read-Only: Administrators can view all user profiles, and only edit driver profiles.')}</span>
          </div>
        )}

        {mode === 'admin_manage_driver' && (
          <div className="bg-orange-50 border-b border-orange-200 px-5 py-2.5 flex items-center gap-2 text-xs text-orange-950 font-semibold shrink-0">
            <ShieldCheck className="h-4 w-4 text-[#F37021] shrink-0" />
            <span>{t('profile.adminDriverNotice', 'Administrator Duty Console: Changes made here directly update the driver roster and dispatch vehicle.')}</span>
          </div>
        )}

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="rounded-2xl border border-red-300 bg-red-50 p-3 text-xs font-bold text-red-900 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isSuccess && (
            <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-bold text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{t('profile.saveSuccess', 'Profile updated successfully!')}</span>
            </div>
          )}

          {/* 1. Profile Photo Upload Section */}
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 shadow-xs">
            <div className="relative group shrink-0">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-3xl overflow-hidden bg-white border-2 border-neutral-200 shadow-md flex items-center justify-center relative">
                {avatarUrl && !avatarError ? (
                  <Image
                    src={avatarUrl}
                    alt={fullName || 'Profile Photo'}
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                    unoptimized={avatarUrl.startsWith('data:')}
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-orange-100 to-amber-200 text-[#F37021] font-black text-2xl flex items-center justify-center">
                    {fullName ? fullName.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() : <User className="h-8 w-8 text-neutral-400" />}
                  </div>
                )}

                {/* Upload Overlay Button (hidden in read-only mode) */}
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold gap-1"
                    title={t('profile.uploadPhoto', 'Upload Photo')}
                  >
                    <Camera className="h-5 w-5" />
                    <span>{t('profile.change', 'Change')}</span>
                  </button>
                )}
              </div>

              {/* Mobile Camera Badge */}
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="sm:hidden absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-[#F37021] text-white flex items-center justify-center shadow-md border-2 border-white tap-target"
                  aria-label="Upload Photo"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Photo Action Buttons & Info */}
            <div className="flex-1 text-center sm:text-left space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-sm font-black text-neutral-900">
                  {t('profile.photoTitle', 'Profile Photo')}
                </h3>
                {avatarUrl && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="h-2.5 w-2.5" />
                    {t('profile.customPhotoSet', 'Uploaded')}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500">
                {isReadOnly 
                  ? t('profile.readOnlyPhotoNote', 'Photo uploaded and managed directly by the user.')
                  : t('profile.photoRecommendation', 'Recommended square JPG, PNG, or WebP. Max 5MB.')}
              </p>

              {!isReadOnly && (
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-[#F37021] hover:bg-[#D9530F] text-white text-xs font-black shadow-xs tap-target transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>{avatarUrl ? t('profile.changePhoto', 'Change Photo') : t('profile.uploadPhoto', 'Upload Photo')}</span>
                  </button>

                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-2.5 py-1.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-600 text-xs font-bold tap-target transition-all flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-neutral-400" />
                      <span>{t('profile.remove', 'Remove')}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 2. Core Profile Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                {t('profile.fullName', 'Full Name')}
              </label>
              <input
                type="text"
                disabled={isReadOnly}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="apple-input w-full font-bold disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                {profile.role === 'customer' 
                  ? t('profile.okuCardNo', 'OKU Card / IC Number') 
                  : t('profile.staffId', 'Staff ID / IC Number')}
              </label>
              <input
                type="text"
                disabled={isReadOnly}
                value={icNumber}
                onChange={(e) => setIcNumber(e.target.value)}
                className="apple-input w-full font-mono disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                {t('profile.phoneNumber', 'Contact Phone')}
              </label>
              <input
                type="text"
                disabled={isReadOnly}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="apple-input w-full disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                {t('profile.emailAddress', 'Email Address')}
              </label>
              <input
                type="email"
                disabled={isReadOnly}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="apple-input w-full disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed font-medium"
              />
            </div>
          </div>

          {/* 3. Address / Pickup Station */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              {profile.role === 'customer' 
                ? t('profile.homeAddress', 'Home Address (Default Pickup)') 
                : t('profile.operatingBase', 'Operating Station / Base')}
            </label>
            <textarea
              rows={2}
              disabled={isReadOnly}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="apple-input w-full resize-none disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed font-medium"
            />
          </div>

          {/* 4. Customer Specific: Mobility Type & Bank Disbursement */}
          {profile.role === 'customer' && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 space-y-4 shadow-xs">
              <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                <Accessibility className="h-4 w-4 text-[#F37021]" />
                {t('profile.accessibilityHeading', 'Accessibility & Mobility Profile')}
              </h4>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  {t('profile.mobilityType', 'Mobility Requirement')}
                </label>
                <select
                  disabled={isReadOnly}
                  value={mobilityType}
                  onChange={(e) => setMobilityType(e.target.value as MobilityType)}
                  className="apple-input w-full font-bold disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed"
                >
                  {MOBILITY_OPTIONS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  {t('profile.beneficiaryType', 'Beneficiary Category')}
                </label>
                <select
                  disabled={isReadOnly}
                  value={beneficiaryType}
                  onChange={(e) => setBeneficiaryType(e.target.value as BeneficiaryType)}
                  className="apple-input w-full font-bold disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed"
                >
                  <option value="resident">{t('profile.beneficiaryTypeResident', 'Resident (Living in Centre)')}</option>
                  <option value="daycare">{t('profile.beneficiaryTypeDaycare', 'Daycare (Daily Workshop)')}</option>
                  <option value="non_resident">{t('profile.beneficiaryTypeNonResident', 'Non-Resident (Transport Only)')}</option>
                </select>
                <p className="text-[11px] text-neutral-500 mt-1">
                  {beneficiaryType === 'non_resident' 
                    ? t('profile.nonResidentNote', 'Non-resident beneficiaries can only access the booking van function.')
                    : t('profile.residentDaycareNote', 'Resident and Daycare beneficiaries have access to both van booking and workshop income tracking.')}
                </p>
              </div>
            </div>
          )}

          {/* 5. Driver Specific: Licensing, Vehicle Plate, Duty Status & Notes */}
          {isDriverManagement && (
            <div className="rounded-2xl border-2 border-orange-200 bg-orange-50/50 p-4 space-y-4 shadow-xs">
              <h4 className="text-xs font-black uppercase tracking-wider text-orange-950 flex items-center gap-1.5">
                <Car className="h-4 w-4 text-[#F37021]" />
                {t('profile.driverCredentials', 'Driver Accreditation & Vehicle Assignment')}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    {t('profile.drivingLicense', 'GDL Public Service License')}
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={driverLicense}
                    onChange={(e) => setDriverLicense(e.target.value)}
                    placeholder="e.g. D-882910-B2 (GDL)"
                    className="apple-input w-full font-mono font-bold disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    {t('profile.assignedVehicle', 'Assigned Van Plate')}
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    placeholder="e.g. WVV 4108"
                    className="apple-input w-full font-mono font-black text-[#F37021] disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    {t('profile.dutyStatus', 'Operational Duty Status')}
                  </label>
                  <select
                    disabled={isReadOnly}
                    value={driverStatus}
                    onChange={(e) => setDriverStatus(e.target.value as any)}
                    className="apple-input w-full font-bold disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed"
                  >
                    <option value="active">{t('profile.statusActive', 'Active on Duty')}</option>
                    <option value="on_leave">{t('profile.statusOnLeave', 'On Scheduled Leave')}</option>
                    <option value="standby">{t('profile.statusStandby', 'Standby Reserve')}</option>
                  </select>
                </div>

                {mode === 'admin_manage_driver' && (
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      {t('profile.adminApprovalStatus', 'Administrator Account Clearance')}
                    </label>
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 bg-neutral-50">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-800">
                        <input
                          type="checkbox"
                          checked={isApproved}
                          onChange={(e) => setIsApproved(e.target.checked)}
                          className="h-4 w-4 rounded text-[#F37021] focus:ring-orange-400"
                        />
                        <span>{t('profile.accountApprovedCheck', 'Account Approved by Administrator for Duty')}</span>
                      </label>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    {t('profile.adminNotes', 'Certifications & Medical Safety Notes')}
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Hydraulic tailgate certified, CPR trained"
                    className="apple-input w-full text-xs disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 6. Emergency Contact */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 space-y-3 shadow-xs">
            <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              {t('profile.emergencyContactHeading', 'Emergency Next-of-Kin Contact')}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  {t('profile.emergencyName', 'Contact Name / Relationship')}
                </label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="e.g. Family member, Guardian"
                  className="apple-input w-full font-medium disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  {t('profile.emergencyPhone', 'Emergency Phone Number')}
                </label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="+60 1x-xxx xxxx"
                  className="apple-input w-full font-mono disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 text-xs font-bold tap-target transition-all"
            >
              {isReadOnly ? t('common.close', 'Close') : t('common.cancel', 'Cancel')}
            </button>

            {!isReadOnly && (
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#F37021] hover:bg-[#D9530F] text-white text-xs font-black shadow-md tap-target transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Check className="h-4 w-4 stroke-[2.5]" />
                <span>{t('profile.saveChanges', 'Save Profile Changes')}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

