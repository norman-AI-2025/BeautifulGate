import { NextResponse } from 'next/server';

export interface VerifiedLocation {
  id: string;
  name: string;
  display_name: string;
  lat: number;
  lon: number;
  country_code: string;
  state: string;
  is_verified_hospital: boolean;
}

// Curated verified Malaysian public & specialist hospitals registry with verified coordinates
const VERIFIED_MALAYSIAN_HOSPITALS: VerifiedLocation[] = [
  {
    id: 'my-hosp-htj',
    name: "Hospital Tuanku Ja'afar (HTJ)",
    display_name: "Hospital Tuanku Ja'afar, Jalan Rasah, 70300 Seremban, Negeri Sembilan, Malaysia",
    lat: 2.7167,
    lon: 101.9422,
    country_code: 'my',
    state: 'Negeri Sembilan',
    is_verified_hospital: true,
  },
  {
    id: 'my-hosp-hkl',
    name: 'Hospital Kuala Lumpur (HKL)',
    display_name: 'Hospital Kuala Lumpur, Jalan Pahang, 50586 Kuala Lumpur, Malaysia',
    lat: 3.1718,
    lon: 101.7019,
    country_code: 'my',
    state: 'Kuala Lumpur',
    is_verified_hospital: true,
  },
  {
    id: 'my-hosp-ppum',
    name: 'University Malaya Medical Centre (PPUM)',
    display_name: 'Pusat Perubatan Universiti Malaya, Lembah Pantai, 59100 Kuala Lumpur, Malaysia',
    lat: 3.1132,
    lon: 101.6534,
    country_code: 'my',
    state: 'Kuala Lumpur',
    is_verified_hospital: true,
  },
  {
    id: 'my-hosp-serdang',
    name: 'Hospital Sultan Idris Shah (Serdang)',
    display_name: 'Hospital Sultan Idris Shah, Jalan Puchong, 43000 Kajang, Selangor, Malaysia',
    lat: 2.9765,
    lon: 101.7214,
    country_code: 'my',
    state: 'Selangor',
    is_verified_hospital: true,
  },
  {
    id: 'my-hosp-selayang',
    name: 'Hospital Selayang',
    display_name: 'Hospital Selayang, Lebuhraya Selayang-Kepong, 68100 Batu Caves, Selangor, Malaysia',
    lat: 3.2458,
    lon: 101.6508,
    country_code: 'my',
    state: 'Selangor',
    is_verified_hospital: true,
  },
  {
    id: 'my-hosp-sgbuloh',
    name: 'Hospital Sungai Buloh',
    display_name: 'Hospital Sungai Buloh, Jalan Hospital, 47000 Sungai Buloh, Selangor, Malaysia',
    lat: 3.2185,
    lon: 101.5818,
    country_code: 'my',
    state: 'Selangor',
    is_verified_hospital: true,
  },
  {
    id: 'my-hosp-shahalam',
    name: 'Hospital Shah Alam',
    display_name: 'Hospital Shah Alam, Seksyen 7, 40000 Shah Alam, Selangor, Malaysia',
    lat: 3.0715,
    lon: 101.4908,
    country_code: 'my',
    state: 'Selangor',
    is_verified_hospital: true,
  },
  {
    id: 'my-hosp-htar',
    name: 'Hospital Tengku Ampuan Rahimah (HTAR Klang)',
    display_name: 'Hospital Tengku Ampuan Rahimah, Jalan Langat, 41200 Klang, Selangor, Malaysia',
    lat: 3.0205,
    lon: 101.4402,
    country_code: 'my',
    state: 'Selangor',
    is_verified_hospital: true,
  },
  {
    id: 'my-hosp-ijn',
    name: 'Institut Jantung Negara (National Heart Institute)',
    display_name: 'Institut Jantung Negara, 145 Jalan Tun Razak, 50400 Kuala Lumpur, Malaysia',
    lat: 3.1706,
    lon: 101.7118,
    country_code: 'my',
    state: 'Kuala Lumpur',
    is_verified_hospital: true,
  },
  {
    id: 'my-hosp-ampang',
    name: 'Hospital Ampang',
    display_name: 'Hospital Ampang, Jalan Mewah 4, Pandan Mewah, 68000 Ampang, Selangor, Malaysia',
    lat: 3.1286,
    lon: 101.7612,
    country_code: 'my',
    state: 'Selangor',
    is_verified_hospital: true,
  },
  {
    id: 'my-hosp-putrajaya',
    name: 'Hospital Putrajaya',
    display_name: 'Hospital Putrajaya, Pusat Pentadbiran Kerajaan Persekutuan, Presint 7, 62250 Putrajaya, Malaysia',
    lat: 2.9288,
    lon: 101.6742,
    country_code: 'my',
    state: 'Putrajaya',
    is_verified_hospital: true,
  },
  {
    id: 'my-hosp-kajang',
    name: 'Hospital Kajang',
    display_name: 'Hospital Kajang, Jalan Semenyih, 43000 Kajang, Selangor, Malaysia',
    lat: 2.9928,
    lon: 101.7925,
    country_code: 'my',
    state: 'Selangor',
    is_verified_hospital: true,
  },
  {
    id: 'my-hosp-sunway',
    name: 'Pusat Perubatan Sunway (Sunway Medical Centre)',
    display_name: 'Sunway Medical Centre, 5 Jalan Lagoon Selatan, Bandar Sunway, 47500 Petaling Jaya, Selangor, Malaysia',
    lat: 3.0674,
    lon: 101.6095,
    country_code: 'my',
    state: 'Selangor',
    is_verified_hospital: true,
  },
  {
    id: 'my-hosp-sjmc',
    name: 'Subang Jaya Medical Centre (SJMC)',
    display_name: 'Subang Jaya Medical Centre, 1 Jalan SS 12/1A, 47500 Subang Jaya, Selangor, Malaysia',
    lat: 3.0772,
    lon: 101.5934,
    country_code: 'my',
    state: 'Selangor',
    is_verified_hospital: true,
  },
  {
    id: 'my-hosp-hukm',
    name: 'Hospital Canselor Tuanku Muhriz UKM (HUKM Cheras)',
    display_name: 'Hospital Canselor Tuanku Muhriz UKM, Jalan Yaacob Latif, Bandar Tun Razak, 56000 Cheras, Kuala Lumpur, Malaysia',
    lat: 3.0998,
    lon: 101.7226,
    country_code: 'my',
    state: 'Kuala Lumpur',
    is_verified_hospital: true,
  },
  {
    id: 'my-hosp-kpj-seremban',
    name: 'KPJ Seremban Specialist Hospital',
    display_name: 'KPJ Seremban Specialist Hospital, Jalan Tan Sri Manickavasagam, 70200 Seremban, Negeri Sembilan, Malaysia',
    lat: 2.7235,
    lon: 101.9288,
    country_code: 'my',
    state: 'Negeri Sembilan',
    is_verified_hospital: true,
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() || '';

  if (!query || query.length < 2) {
    return NextResponse.json(VERIFIED_MALAYSIAN_HOSPITALS.slice(0, 10));
  }

  const queryLower = query.toLowerCase();

  // 1. First check matching verified Malaysian hospitals for instant <10ms match
  const matchedHospitals = VERIFIED_MALAYSIAN_HOSPITALS.filter(
    h =>
      h.name.toLowerCase().includes(queryLower) ||
      h.display_name.toLowerCase().includes(queryLower) ||
      h.state.toLowerCase().includes(queryLower)
  );

  // 2. Query OpenStreetMap Nominatim with strict countrycodes=my
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query
    )}&format=json&countrycodes=my&limit=8&addressdetails=1`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'BeautifulGate-AccessibleTransit/1.0 (contact@beautifulgate.org.my)',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const externalData: any[] = await res.json();
      
      const externalResults: VerifiedLocation[] = externalData
        .filter(item => item.address?.country_code === 'my') // Strict check to guarantee Malaysia only!
        .map(item => {
          const lat = parseFloat(item.lat);
          const lon = parseFloat(item.lon);
          const state = item.address?.state || item.address?.city || 'Malaysia';
          const name = item.name || item.display_name.split(',')[0];

          return {
            id: `osm-${item.place_id}`,
            name,
            display_name: item.display_name,
            lat,
            lon,
            country_code: 'my',
            state,
            is_verified_hospital: item.type === 'hospital' || item.class === 'amenity',
          };
        });

      // Merge and deduplicate by name
      const combined = [...matchedHospitals];
      externalResults.forEach(ext => {
        if (!combined.some(c => c.name.toLowerCase() === ext.name.toLowerCase())) {
          combined.push(ext);
        }
      });

      return NextResponse.json(combined.slice(0, 8));
    }
  } catch (err) {
    console.warn('External geocoder unavailable, using verified local registry', err);
  }

  // Fallback to local verified registry
  return NextResponse.json(matchedHospitals);
}

