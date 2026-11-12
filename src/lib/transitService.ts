import { TransitBooking, TransitService, TransitStatus } from '@/types';

/**
 * Normalizes date to comparable string e.g. "2026-11-10" or trimmed date string
 */
export const normalizeBookingDate = (d?: string): string => {
  if (!d) return '';
  const clean = d.trim();
  const ymd = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;
  return clean.replace(/,/g, ' ').replace(/\s+/g, ' ');
};

/**
 * Checks whether a booking record represents a return leg (Hospital → Home)
 */
export const isReturnBooking = (b: TransitBooking): boolean => {
  if (b.journey_type === 'return') return true;
  const clinic = (b.clinic_department || '').toLowerCase();
  const hosp = (b.hospital_name || '').toLowerCase();
  return clinic.includes('return') || hosp.includes('home');
};

/**
 * Groups raw outbound and return bookings into unified Transit Services (Home -> Hospital -> Home = 1 Service).
 */
export function groupBookingsIntoServices(bookings: TransitBooking[]): TransitService[] {
  const services: TransitService[] = [];
  const processedReturnIds = new Set<string>();

  const returns = bookings.filter(isReturnBooking);
  const outbounds = bookings.filter(b => !isReturnBooking(b));

  outbounds.forEach((outbound) => {
    // 1. Try to find return leg by explicit linked_booking_id
    let matchingReturn = returns.find(
      r => (r.linked_booking_id === outbound.id || outbound.linked_booking_id === r.id) && !processedReturnIds.has(r.id)
    );

    // 2. Fallback: match by same normalized date and passenger
    if (!matchingReturn) {
      const normOutboundDate = normalizeBookingDate(outbound.date);
      matchingReturn = returns.find(r => {
        if (processedReturnIds.has(r.id)) return false;
        const normReturnDate = normalizeBookingDate(r.date);
        const sameDate = normReturnDate && normOutboundDate && normReturnDate === normOutboundDate;
        const samePassenger = (r.passenger_id && outbound.passenger_id && r.passenger_id !== 'guest' && r.passenger_id === outbound.passenger_id) ||
                              (r.passenger_name && outbound.passenger_name && r.passenger_name.toLowerCase() === outbound.passenger_name.toLowerCase()) ||
                              (r.phone && outbound.phone && r.phone === outbound.phone);
        return sameDate && samePassenger;
      });
    }

    if (matchingReturn) {
      processedReturnIds.add(matchingReturn.id);
    }

    const isRoundtrip = Boolean(matchingReturn);
    const outboundDone = outbound.status === 'dropped_off' || outbound.status === 'en_route_next';

    // Current phase: if roundtrip and outbound is done, switch to return leg; otherwise outbound
    const currentPhase: 'outbound' | 'return' = (matchingReturn && outboundDone) ? 'return' : 'outbound';
    const activeLeg = (matchingReturn && outboundDone) ? matchingReturn : outbound;
    const currentState: TransitStatus = activeLeg.status;

    // Service is completed when all legs are completed
    const isCompleted = matchingReturn
      ? (outboundDone && (matchingReturn.status === 'dropped_off' || matchingReturn.status === 'en_route_next'))
      : outboundDone;

    const isPending = activeLeg.status === 'pending';
    const isDeclined = outbound.status === 'declined' || (matchingReturn?.status === 'declined');

    services.push({
      id: outbound.id,
      passenger_id: outbound.passenger_id,
      passenger_name: outbound.passenger_name,
      oku_id: outbound.oku_id,
      phone: outbound.phone,
      date: outbound.date || 'Today',
      outbound,
      returnLeg: matchingReturn,
      activeLeg,
      currentPhase,
      currentState,
      isRoundtrip,
      isCompleted,
      isPending,
      isDeclined,
      mobility_type: outbound.mobility_type,
    });
  });

  // Any unmatched return bookings (e.g. booked separately without an outbound) become their own single-leg service
  returns.forEach((ret) => {
    if (!processedReturnIds.has(ret.id)) {
      const isDone = ret.status === 'dropped_off' || ret.status === 'en_route_next';
      services.push({
        id: ret.id,
        passenger_id: ret.passenger_id,
        passenger_name: ret.passenger_name,
        oku_id: ret.oku_id,
        phone: ret.phone,
        date: ret.date || 'Today',
        outbound: ret,
        returnLeg: ret,
        activeLeg: ret,
        currentPhase: 'return',
        currentState: ret.status,
        isRoundtrip: false,
        isCompleted: isDone,
        isPending: ret.status === 'pending',
        isDeclined: ret.status === 'declined',
        mobility_type: ret.mobility_type,
      });
    }
  });

  return services;
}

