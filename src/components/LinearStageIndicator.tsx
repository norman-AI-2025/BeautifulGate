'use client';

import React from 'react';
import { Check, Clock } from 'lucide-react';
import { TransitStatus } from '@/types';

interface LinearStageIndicatorProps {
  status: TransitStatus;
  timestamps: {
    requested?: string;
    approved?: string;
    en_route_pickup?: string;
    picked_up?: string;
    en_route_hospital?: string;
    dropped_off?: string;
    en_route_next?: string;
    [key: string]: string | undefined;
  };
}

interface StageStep {
  id: string;
  label: string;
  activeStatusKey: TransitStatus[];
  timestampKey: string;
}

const STAGES: StageStep[] = [
  {
    id: 'step-1',
    label: 'On the way to pick up',
    activeStatusKey: ['approved', 'en_route_pickup', 'picked_up', 'en_route_hospital', 'dropped_off', 'en_route_next'],
    timestampKey: 'en_route_pickup',
  },
  {
    id: 'step-2',
    label: 'Picked up',
    activeStatusKey: ['picked_up', 'en_route_hospital', 'dropped_off', 'en_route_next'],
    timestampKey: 'picked_up',
  },
  {
    id: 'step-3',
    label: 'On the way to destination',
    activeStatusKey: ['en_route_hospital', 'dropped_off', 'en_route_next'],
    timestampKey: 'en_route_hospital',
  },
  {
    id: 'step-4',
    label: 'Arrived',
    activeStatusKey: ['dropped_off', 'en_route_next'],
    timestampKey: 'dropped_off',
  },
];

const formatTimeString = (isoString?: string): string => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

export const LinearStageIndicator: React.FC<LinearStageIndicatorProps> = ({ status, timestamps }) => {
  const getStageState = (stageIndex: number) => {
    // Current status index in progression
    let currentLevel = 0;
    if (status === 'approved') currentLevel = 0.5;
    else if (status === 'en_route_pickup') currentLevel = 1;
    else if (status === 'picked_up') currentLevel = 2;
    else if (status === 'en_route_hospital') currentLevel = 3;
    else if (status === 'dropped_off' || status === 'en_route_next') currentLevel = 4;

    const stepIndexOneBased = stageIndex + 1;

    if (currentLevel > stepIndexOneBased) {
      return 'completed';
    } else if (currentLevel === stepIndexOneBased) {
      return 'current';
    } else if (stageIndex === 0 && currentLevel === 0.5) {
      return 'upcoming_ready';
    }
    return 'upcoming';
  };

  return (
    <div className="w-full py-4">
      <div className="relative flex items-center justify-between">
        {/* Connecting line */}
        <div className="absolute left-6 right-6 top-4 h-1 -translate-y-1/2 bg-neutral-200 rounded-full" aria-hidden="true">
          <div
            className="h-full bg-gradient-to-r from-teal-600 to-emerald-500 rounded-full transition-all duration-300"
            style={{
              width:
                status === 'approved'
                  ? '5%'
                  : status === 'en_route_pickup'
                  ? '33.3%'
                  : status === 'picked_up'
                  ? '66.6%'
                  : status === 'en_route_hospital'
                  ? '85%'
                  : status === 'dropped_off' || status === 'en_route_next'
                  ? '100%'
                  : '0%',
            }}
          />
        </div>

        {STAGES.map((stage, idx) => {
          const state = getStageState(idx);
          const time = formatTimeString(timestamps[stage.timestampKey]);

          return (
            <div key={stage.id} className="relative z-10 flex flex-col items-center">
              {/* Indicator Circle */}
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all shadow-sm ${
                  state === 'completed'
                    ? 'bg-emerald-600 text-white shadow-emerald-200'
                    : state === 'current'
                    ? 'bg-teal-700 text-white ring-4 ring-teal-100 scale-110 shadow-teal-300'
                    : state === 'upcoming_ready'
                    ? 'border-2 border-teal-600 bg-white text-teal-800'
                    : 'border border-neutral-300 bg-white text-neutral-400'
                }`}
              >
                {state === 'completed' ? (
                  <Check className="h-4 w-4 stroke-[3]" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              {/* Label */}
              <div className="mt-2 text-center max-w-[80px] sm:max-w-[120px]">
                <p
                  className={`text-[11px] sm:text-xs font-bold leading-tight ${
                    state === 'current'
                      ? 'text-teal-900 font-extrabold'
                      : state === 'completed'
                      ? 'text-emerald-700'
                      : 'text-neutral-400'
                  }`}
                >
                  {stage.label}
                </p>
                {time ? (
                  <p className="mt-0.5 flex items-center justify-center gap-1 text-[10px] font-mono text-neutral-500">
                    <Clock className="h-2.5 w-2.5" />
                    {time}
                  </p>
                ) : (
                  <p className="mt-0.5 text-[10px] text-neutral-300 font-mono">--:--</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

