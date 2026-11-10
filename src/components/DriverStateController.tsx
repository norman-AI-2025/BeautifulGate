'use client';

import React from 'react';
import { ArrowRight, CheckCheck, Navigation, MapPin } from 'lucide-react';
import { TransitBooking } from '@/types';
import { useApp } from '@/context/AppContext';

interface DriverStateControllerProps {
  currentBooking: TransitBooking;
  onPromoteNext: () => void;
  hasNextBooking: boolean;
}

export const DriverStateController: React.FC<DriverStateControllerProps> = ({
  currentBooking,
  onPromoteNext,
  hasNextBooking,
}) => {
  const { updateBookingStatus } = useApp();

  const status = currentBooking.status;

  // Determine current step index (1-5) and button configuration
  let stepNumber = 1;
  let actionLabel = 'Start Route to Pickup';
  let nextStatus: string | null = 'en_route_pickup';
  let buttonIcon = Navigation;

  if (status === 'approved' || status === 'pending') {
    stepNumber = 1;
    actionLabel = 'Start Route to Pickup';
    nextStatus = 'en_route_pickup';
    buttonIcon = Navigation;
  } else if (status === 'en_route_pickup') {
    stepNumber = 2;
    actionLabel = 'Done Pick Up';
    nextStatus = 'picked_up';
    buttonIcon = CheckCheck;
  } else if (status === 'picked_up') {
    stepNumber = 3;
    actionLabel = 'Depart to Hospital';
    nextStatus = 'en_route_hospital';
    buttonIcon = Navigation;
  } else if (status === 'en_route_hospital') {
    stepNumber = 4;
    actionLabel = 'Done Drop Off';
    nextStatus = 'dropped_off';
    buttonIcon = MapPin;
  } else if (status === 'dropped_off' || status === 'en_route_next') {
    stepNumber = 5;
    actionLabel = hasNextBooking ? 'On the Way to Next Customer' : 'Shift Completed (All Pickups Done)';
    nextStatus = hasNextBooking ? 'en_route_next' : null;
    buttonIcon = ArrowRight;
  }

  const handleActionClick = () => {
    if (stepNumber === 5) {
      if (hasNextBooking) {
        updateBookingStatus(currentBooking.id, 'en_route_next');
        onPromoteNext();
      }
      return;
    }

    if (nextStatus) {
      updateBookingStatus(currentBooking.id, nextStatus as any);
    }
  };

  const IconComponent = buttonIcon;

  return (
    <div className="w-full space-y-3">
      {/* Current Step Progress Line */}
      <div className="flex items-center justify-between text-xs font-semibold text-neutral-600 px-1">
        <span>Step {Math.min(stepNumber, 5)} of 5</span>
        <span className="uppercase tracking-wider font-mono text-[11px] text-neutral-500">
          State: {status.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-black h-full transition-all duration-300"
          style={{ width: `${(Math.min(stepNumber, 5) / 5) * 100}%` }}
        />
      </div>

      {/* Sequential Single-Button State Machine */}
      <button
        type="button"
        disabled={stepNumber === 5 && !hasNextBooking}
        onClick={handleActionClick}
        className={`w-full h-16 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg tracking-tight transition-all active:scale-[0.98] shadow-md tap-target ${
          stepNumber === 5 && !hasNextBooking
            ? 'bg-neutral-300 text-neutral-600 cursor-default shadow-none'
            : 'bg-[#F37021] text-white hover:bg-[#D9530F]'
        }`}
      >
        <IconComponent className="h-6 w-6 stroke-[2.2]" />
        <span>{actionLabel}</span>
      </button>
    </div>
  );
};

