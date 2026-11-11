import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Helper to extract donation details from bank notification email text
export function parseBankNotificationEmail(emailContent: string) {
  const content = emailContent || '';

  // 1. Extract Reference Code (Format: BG-TR-XXXX or BG-XXXX or BKG-XXXX)
  const refMatch = 
    content.match(/BG-TR-([A-Za-z0-9_-]+)/i) ||
    content.match(/BG-([A-Za-z0-9_-]+)/i) ||
    content.match(/Ref(?:erence)?(?:\s*No\.?|:)?\s*([A-Za-z0-9_-]+)/i) ||
    content.match(/Recipient\s*Ref(?:erence)?:?\s*([A-Za-z0-9_-]+)/i);

  const referenceCode = refMatch ? refMatch[0].trim().toUpperCase() : null;
  const rawKey = refMatch && refMatch[1] ? refMatch[1].trim() : null;

  // 2. Extract Amount (RM 10.00 or MYR 10.00 or 10.00 MYR)
  const amountMatch = 
    content.match(/(?:RM|MYR)\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{2})?)/i) ||
    content.match(/([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{2})?)\s*(?:RM|MYR)/i);

  let amount: number | null = null;
  if (amountMatch) {
    amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  }

  // 3. Detect Bank Name
  let bankName = 'Malaysian Bank';
  const lower = content.toLowerCase();
  if (lower.includes('maybank') || lower.includes('mae')) bankName = 'Maybank';
  else if (lower.includes('public bank') || lower.includes('pbe')) bankName = 'Public Bank';
  else if (lower.includes('cimb')) bankName = 'CIMB';
  else if (lower.includes('hong leong') || lower.includes('hlb')) bankName = 'Hong Leong Bank';
  else if (lower.includes('rhb')) bankName = 'RHB Bank';
  else if (lower.includes('tng') || lower.includes("touch 'n go")) bankName = "Touch 'n Go eWallet";
  else if (lower.includes('duitnow')) bankName = 'DuitNow National QR';

  return {
    referenceCode,
    rawKey,
    amount,
    bankName,
  };
}

export async function POST(req: NextRequest) {
  try {
    let emailText = '';
    let emailSubject = '';

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      emailText = body.text || body.body || body.content || body.html || body.message || JSON.stringify(body);
      emailSubject = body.subject || '';
    } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      emailText = (formData.get('text') || formData.get('body-plain') || formData.get('body') || formData.get('html') || '') as string;
      emailSubject = (formData.get('subject') || '') as string;
    } else {
      emailText = await req.text();
    }

    const fullContent = `${emailSubject}\n${emailText}`;
    const parsed = parseBankNotificationEmail(fullContent);

    if (!parsed.referenceCode && !parsed.rawKey) {
      return NextResponse.json({
        success: false,
        error: 'No valid Beautiful Gate donation reference code (BG-TR-XXXX) detected in email alert.',
        parsed,
      }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Supabase client is not configured.',
        parsed,
      }, { status: 500 });
    }

    // Find the matching transit booking in Supabase
    // Reference is either BG-TR-[BookingIDPrefix] or matches booking id
    const { data: bookings, error: fetchErr } = await supabase
      .from('transit_bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchErr) {
      return NextResponse.json({
        success: false,
        error: 'Database query failed',
        details: fetchErr.message,
      }, { status: 500 });
    }

    // Match booking by ID prefix or exact match
    const searchTarget = (parsed.rawKey || '').toLowerCase();
    const fullRef = (parsed.referenceCode || '').toLowerCase();

    const matchedBooking = (bookings || []).find(b => {
      const bId = b.id.toLowerCase();
      return (
        bId === searchTarget ||
        bId.startsWith(searchTarget) ||
        fullRef.includes(bId.slice(0, 8)) ||
        (searchTarget.length >= 4 && bId.includes(searchTarget))
      );
    });

    if (!matchedBooking) {
      return NextResponse.json({
        success: false,
        error: `Could not find an active transit booking matching reference: ${parsed.referenceCode}`,
        parsed,
      }, { status: 404 });
    }

    // Auto-verify donation in Supabase
    const verifiedAmount = parsed.amount || Number(matchedBooking.donation_amount) || 10.00;
    const nowIso = new Date().toISOString();

    const { error: updateErr } = await supabase
      .from('transit_bookings')
      .update({
        donation_amount: verifiedAmount,
        donation_method: 'qr',
        donation_status: 'verified',
        donation_recorded_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', matchedBooking.id);

    if (updateErr) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update donation verification status in database.',
        details: updateErr.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Donation verified successfully via ${parsed.bankName} incoming email alert.`,
      verifiedBookingId: matchedBooking.id,
      passengerName: matchedBooking.passenger_name,
      amount: verifiedAmount,
      referenceCode: parsed.referenceCode,
      bank: parsed.bankName,
      verifiedAt: nowIso,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error processing bank email webhook.',
      details: err?.message || String(err),
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/webhooks/bank-email',
    description: 'Beautiful Gate Automated Inward Bank Email Parser for DuitNow QR Donations',
    instructions: [
      '1. Enable Email Alerts for inbound DuitNow transfers in your corporate banking portal (Maybank2u Biz / PB Enterprise / CIMB).',
      '2. Forward or route notification emails to this webhook URL.',
      '3. The parser extracts the amount, bank, and reference code (BG-TR-XXXX), and automatically verifies the donation in Supabase in real-time.',
    ],
  });
}
