'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { 
  X, 
  Car, 
  Camera, 
  Check, 
  Trash2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { Vehicle } from '@/types';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';

export interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetVehicle?: Vehicle | null;
}

export const VehicleModal: React.FC<VehicleModalProps> = ({
  isOpen,
  onClose,
  targetVehicle,
}) => {
  const { vehicles, updateVehicle } = useApp();
  const { t } = useLanguage();

  const activeVehicle = targetVehicle || vehicles[0] || {
    id: 'veh-hiace-wvv4108',
    plate: 'WVV 4108',
    brand: 'Toyota',
    model: 'HiAce High-Roof Commuter',
    color: 'Pearl White',
    seats: '7 Passengers (Row 1: Driver + 1 Pax | Row 2: 4 Regular Seats | Row 3: 2 Wheelchair Bays)',
    image_url: '/images/toyota-hiace-van.jpg',
    status: 'active' as const,
    notes: 'Fitted with rear hydraulic boarding lift and floor clamps',
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [plate, setPlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [seats, setSeats] = useState('');
  const [status, setStatus] = useState<'active' | 'maintenance' | 'standby'>('active');
  const [imageUrl, setImageUrl] = useState<string>('/images/toyota-hiace-van.jpg');
  const [notes, setNotes] = useState('');

  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (activeVehicle) {
      setPlate(activeVehicle.plate || '');
      setBrand(activeVehicle.brand || '');
      setModel(activeVehicle.model || '');
      setColor(activeVehicle.color || '');
      setSeats(activeVehicle.seats || '');
      setStatus(activeVehicle.status || 'active');
      setImageUrl(activeVehicle.image_url || '/images/toyota-hiace-van.jpg');
      setNotes(activeVehicle.notes || '');
      setErrorMsg('');
      setIsSuccess(false);
    }
  }, [activeVehicle, isOpen]);

  if (!isOpen || !mounted) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 5MB limit. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImageUrl(result);
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate.trim()) {
      setErrorMsg('Vehicle plate number is required.');
      return;
    }

    try {
      await updateVehicle(activeVehicle.id, {
        plate: plate.trim(),
        brand: brand.trim(),
        model: model.trim(),
        color: color.trim(),
        seats: seats.trim(),
        status,
        image_url: imageUrl,
        notes: notes.trim(),
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 700);
    } catch {
      setErrorMsg('Failed to update vehicle.');
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in-50">
      <div className="relative w-full max-w-xl rounded-3xl bg-white border border-neutral-200 shadow-2xl overflow-hidden my-4 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-neutral-900 text-white p-5 sm:p-6 relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all tap-target"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500 text-white">
              Fleet Asset
            </span>
            <span className="font-mono text-xs text-orange-300 font-bold">
              {plate || 'WVV 4108'}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1.5">
            Edit Vehicle Profile
          </h2>
          <p className="text-xs text-neutral-300 mt-0.5">
            Update official fleet specification, passenger seating layout, and operational status.
          </p>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="rounded-2xl border border-red-300 bg-red-50 p-3 text-xs font-bold text-red-900 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isSuccess && (
            <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-bold text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Vehicle profile updated successfully!</span>
            </div>
          )}

          {/* Vehicle Image Upload & Preview */}
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative h-28 w-44 rounded-xl overflow-hidden border border-neutral-300 shadow-xs shrink-0 group">
              <Image
                src={imageUrl || '/images/toyota-hiace-van.jpg'}
                alt={plate}
                fill
                className="object-cover"
                unoptimized={imageUrl.startsWith('data:')}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold gap-1"
              >
                <Camera className="h-4 w-4" />
                <span>Change Image</span>
              </button>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1.5">
              <h4 className="text-xs font-black text-neutral-900">Vehicle Photo</h4>
              <p className="text-[11px] text-neutral-500">
                Official exterior vehicle photo shown across beneficiary booking and dispatch screens.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold tap-target transition-all"
                >
                  Upload New Photo
                </button>
                {imageUrl !== '/images/toyota-hiace-van.jpg' && (
                  <button
                    type="button"
                    onClick={() => setImageUrl('/images/toyota-hiace-van.jpg')}
                    className="px-2.5 py-1.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-600 text-xs font-bold tap-target transition-all"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Plate & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Car Plate Number
              </label>
              <input
                type="text"
                required
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                placeholder="e.g. WVV 4108"
                className="apple-input w-full font-mono font-black text-neutral-900 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Operational Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="apple-input w-full font-bold text-xs"
              >
                <option value="active">Active in Fleet</option>
                <option value="maintenance">Under Scheduled Maintenance</option>
                <option value="standby">Standby Reserve</option>
              </select>
            </div>
          </div>

          {/* Brand, Model & Colour */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Brand
              </label>
              <input
                type="text"
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Toyota"
                className="apple-input w-full text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Model Specification
              </label>
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. HiAce High-Roof Commuter"
                className="apple-input w-full text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Colour
              </label>
              <input
                type="text"
                required
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. Pearl White"
                className="apple-input w-full text-xs font-semibold"
              />
            </div>
          </div>

          {/* Seatings & Layout */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Seating Capacity & Layout
            </label>
            <input
              type="text"
              required
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
              placeholder="e.g. 7 Passengers (Row 1: Driver + 1 Pax | Row 2: 4 Regular Seats | Row 3: 2 Wheelchair Bays)"
              className="apple-input w-full text-xs font-medium"
            />
          </div>

          {/* Accessibility Equipment & Notes */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Accessibility Gear & Maintenance Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Rear hydraulic wheelchair lift certified, floor clamp latch system"
              className="apple-input w-full text-xs resize-none font-medium"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 text-xs font-bold tap-target transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#F37021] hover:bg-[#D9530F] text-white text-xs font-black shadow-md tap-target transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Check className="h-4 w-4 stroke-[2.5]" />
              <span>Save Vehicle Details</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
