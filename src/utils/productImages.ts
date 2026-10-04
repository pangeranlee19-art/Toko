// SVG-based high fidelity product imagery for Indonesian warung staples
// Resilient, offline-ready, zero broken image risk

function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

export const productImages: Record<string, string> = {
  // Garam Dapur Sasa 100gr (matching screenshot)
  'prod-0': svgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 180" width="160" height="180">
      <defs>
        <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.12"/>
        </filter>
      </defs>
      <!-- Pouch body -->
      <rect x="22" y="16" width="116" height="150" rx="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2" filter="url(#shadow)"/>
      <path d="M 22 28 Q 80 34 138 28 L 138 20 Q 80 26 22 20 Z" fill="#DC2626"/>
      <!-- Sasa Oval Logo -->
      <ellipse cx="80" cy="56" rx="30" ry="18" fill="#FFFFFF" stroke="#DC2626" stroke-width="3"/>
      <text x="80" y="62" font-family="'Trebuchet MS', Arial, sans-serif" font-weight="900" font-size="20" fill="#DC2626" text-anchor="middle" letter-spacing="-1">Sasa</text>
      <!-- Garam Text -->
      <text x="80" y="90" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="14" fill="#DC2626" text-anchor="middle">GARAM</text>
      <text x="80" y="102" font-family="sans-serif" font-weight="800" font-size="7" fill="#B91C1C" text-anchor="middle">BERYODIUM</text>
      <!-- Salt crystals illustration -->
      <ellipse cx="80" cy="122" rx="20" ry="8" fill="#F1F5F9" stroke="#CBD5E1"/>
      <circle cx="75" cy="120" r="1.5" fill="#94A3B8"/>
      <circle cx="82" cy="122" r="1.5" fill="#94A3B8"/>
      <circle cx="86" cy="119" r="1.5" fill="#94A3B8"/>
      <!-- Bottom banner -->
      <path d="M 22 152 Q 80 146 138 152 L 138 166 L 22 166 Z" fill="#DC2626"/>
      <text x="80" y="162" font-family="sans-serif" font-weight="800" font-size="8" fill="#FFFFFF" text-anchor="middle">100g</text>
    </svg>
  `),

  // Indomie Goreng (matching screenshot)
  'prod-1': svgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
      <defs>
        <linearGradient id="indomieRed" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#DC2626"/>
          <stop offset="100%" stop-color="#991B1B"/>
        </linearGradient>
        <filter id="packSh" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity="0.12"/>
        </filter>
      </defs>
      <!-- Pack -->
      <rect x="14" y="20" width="132" height="120" rx="10" fill="url(#indomieRed)" stroke="#B91C1C" stroke-width="1.5" filter="url(#packSh)"/>
      <!-- Yellow banner for logo -->
      <rect x="18" y="26" width="124" height="42" rx="6" fill="#FBBF24"/>
      <text x="44" y="44" font-family="'Brush Script MT', cursive, sans-serif" font-style="italic" font-weight="900" font-size="19" fill="#DC2626">Indomie</text>
      <text x="44" y="56" font-family="sans-serif" font-weight="900" font-size="8" fill="#15803D">Mi Instan</text>
      <!-- Mi Goreng text -->
      <text x="24" y="82" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="12" fill="#FFFFFF">Mi</text>
      <text x="24" y="96" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="12" fill="#FFFFFF">goreng</text>
      <!-- Fried egg illustration -->
      <circle cx="106" cy="94" r="28" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="2"/>
      <ellipse cx="106" cy="94" rx="24" ry="24" fill="#D97706" opacity="0.3"/>
      <!-- Fried noodles texture -->
      <path d="M 88 100 Q 94 92 100 102 Q 106 110 114 98 Q 120 106 126 96" fill="none" stroke="#CA8A04" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="106" cy="94" r="11" fill="#F59E0B"/>
      <circle cx="103" cy="91" r="3.5" fill="#FEF08A"/>
    </svg>
  `),

  // Indomie Kuah Ayam Bawang (matching screenshot)
  'prod-2': svgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
      <defs>
        <linearGradient id="indomieGreen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#16A34A"/>
          <stop offset="100%" stop-color="#15803D"/>
        </linearGradient>
        <filter id="packSh2" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity="0.12"/>
        </filter>
      </defs>
      <!-- Pack -->
      <rect x="14" y="20" width="132" height="120" rx="10" fill="url(#indomieGreen)" stroke="#166534" stroke-width="1.5" filter="url(#packSh2)"/>
      <!-- Yellow banner for logo -->
      <rect x="18" y="26" width="124" height="42" rx="6" fill="#FEF08A"/>
      <text x="44" y="44" font-family="'Brush Script MT', cursive, sans-serif" font-style="italic" font-weight="900" font-size="19" fill="#DC2626">Indomie</text>
      <text x="44" y="56" font-family="sans-serif" font-weight="900" font-size="8" fill="#15803D">Mi Kuah</text>
      <!-- Rasa Ayam Bawang -->
      <text x="22" y="80" font-family="sans-serif" font-weight="800" font-size="8" fill="#FEF08A">RASA</text>
      <text x="22" y="94" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="12" fill="#FFFFFF">Soto</text>
      <text x="22" y="108" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="11" fill="#FFFFFF">Ayam</text>
      <!-- Soup bowl with boiled egg -->
      <circle cx="106" cy="94" r="28" fill="#DC2626" stroke="#991B1B" stroke-width="2"/>
      <circle cx="106" cy="94" r="23" fill="#CA8A04"/>
      <!-- Boiled egg half -->
      <ellipse cx="106" cy="94" rx="13" ry="17" fill="#FFFFFF" transform="rotate(-15 106 94)"/>
      <ellipse cx="106" cy="95" rx="7" ry="10" fill="#F59E0B" transform="rotate(-15 106 95)"/>
    </svg>
  `),

  // Beras Rojolele Super 5kg (matching screenshot)
  'prod-3': svgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 180" width="160" height="180">
      <defs>
        <filter id="riceSh" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.14"/>
        </filter>
        <pattern id="ricePattern" width="6" height="6" patternUnits="userSpaceOnUse">
          <ellipse cx="3" cy="3" rx="1.8" ry="1" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="0.5" transform="rotate(30 3 3)"/>
        </pattern>
      </defs>
      <!-- Bag sack outline -->
      <path d="M 28 28 L 132 28 L 126 165 L 34 165 Z" fill="#0284C7" stroke="#0369A1" stroke-width="2" rx="10" filter="url(#riceSh)"/>
      <!-- Top header -->
      <rect x="28" y="28" width="104" height="42" fill="#0369A1"/>
      <!-- Logo circle -->
      <circle cx="80" cy="50" r="16" fill="#FACC15" stroke="#CA8A04" stroke-width="1.5"/>
      <path d="M 72 54 L 80 40 L 88 54 Z" fill="#15803D"/>
      <text x="80" y="80" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="13" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">ROJOLELE</text>
      <text x="80" y="90" font-family="sans-serif" font-weight="800" font-size="6.5" fill="#FEF08A" text-anchor="middle">BERAS PREMIUM</text>
      <!-- Transparent rice window -->
      <rect x="42" y="96" width="76" height="58" rx="8" fill="#FFFFFF" stroke="#38BDF8" stroke-width="1.5"/>
      <rect x="44" y="98" width="72" height="54" rx="6" fill="url(#ricePattern)"/>
      <!-- Weight badge -->
      <rect x="64" y="142" width="32" height="14" rx="4" fill="#0369A1"/>
      <text x="80" y="152" font-family="sans-serif" font-weight="900" font-size="8" fill="#FFFFFF" text-anchor="middle">5 KG</text>
    </svg>
  `),

  // Minyak Goreng Bimoli 1 Liter (matching screenshot)
  'prod-4': svgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 180" width="160" height="180">
      <defs>
        <linearGradient id="bimoliGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FACC15"/>
          <stop offset="50%" stop-color="#F59E0B"/>
          <stop offset="100%" stop-color="#D97706"/>
        </linearGradient>
        <filter id="oilSh" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.14"/>
        </filter>
      </defs>
      <!-- Stand pouch shape -->
      <path d="M 40 24 L 120 24 L 126 150 Q 126 165 80 165 Q 34 165 34 150 Z" fill="url(#bimoliGold)" stroke="#D97706" stroke-width="2" filter="url(#oilSh)"/>
      <!-- Spout -->
      <rect x="44" y="16" width="14" height="10" rx="3" fill="#DC2626"/>
      <!-- Bimoli Red Logo -->
      <rect x="42" y="44" width="76" height="34" rx="6" fill="#FFFFFF" opacity="0.95"/>
      <text x="80" y="66" font-family="'Trebuchet MS', Arial Black, sans-serif" font-weight="900" font-size="18" fill="#DC2626" text-anchor="middle" letter-spacing="-0.5">Bimoli</text>
      <!-- Golden frying visual -->
      <circle cx="80" cy="112" r="22" fill="#FEF08A" stroke="#EAB308" stroke-width="2"/>
      <path d="M 68 116 Q 80 102 92 116" stroke="#D97706" stroke-width="3" fill="none" stroke-linecap="round"/>
      <text x="80" y="148" font-family="sans-serif" font-weight="900" font-size="8" fill="#78350F" text-anchor="middle">MINYAK GORENG 1L</text>
    </svg>
  `),

  // Telur Ayam Negeri Segar (1Kg) (matching screenshot)
  'prod-5': svgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 140" width="160" height="140">
      <defs>
        <linearGradient id="eggGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#F59E0B"/>
          <stop offset="100%" stop-color="#B45309"/>
        </linearGradient>
        <filter id="eggSh" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity="0.12"/>
        </filter>
      </defs>
      <!-- Tray Carton -->
      <rect x="16" y="46" width="128" height="72" rx="10" fill="#E2E8F0" stroke="#CBD5E1" stroke-width="2" filter="url(#eggSh)"/>
      <!-- 10 Egg Carton Grid -->
      <!-- Row 1 -->
      <ellipse cx="36" cy="56" rx="11" ry="15" fill="url(#eggGrad)" stroke="#92400E" stroke-width="0.8"/>
      <ellipse cx="58" cy="56" rx="11" ry="15" fill="url(#eggGrad)" stroke="#92400E" stroke-width="0.8"/>
      <ellipse cx="80" cy="56" rx="11" ry="15" fill="url(#eggGrad)" stroke="#92400E" stroke-width="0.8"/>
      <ellipse cx="102" cy="56" rx="11" ry="15" fill="url(#eggGrad)" stroke="#92400E" stroke-width="0.8"/>
      <ellipse cx="124" cy="56" rx="11" ry="15" fill="url(#eggGrad)" stroke="#92400E" stroke-width="0.8"/>
      <!-- Row 2 -->
      <ellipse cx="36" cy="88" rx="12" ry="16" fill="url(#eggGrad)" stroke="#92400E" stroke-width="0.8"/>
      <ellipse cx="58" cy="88" rx="12" ry="16" fill="url(#eggGrad)" stroke="#92400E" stroke-width="0.8"/>
      <ellipse cx="80" cy="88" rx="12" ry="16" fill="url(#eggGrad)" stroke="#92400E" stroke-width="0.8"/>
      <ellipse cx="102" cy="88" rx="12" ry="16" fill="url(#eggGrad)" stroke="#92400E" stroke-width="0.8"/>
      <ellipse cx="124" cy="88" rx="12" ry="16" fill="url(#eggGrad)" stroke="#92400E" stroke-width="0.8"/>
    </svg>
  `),

  // Gula Pasir Gulaku Kuning 1Kg (matching screenshot)
  'prod-6': svgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 180" width="160" height="180">
      <defs>
        <linearGradient id="gulakuGreen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#15803D"/>
          <stop offset="100%" stop-color="#166534"/>
        </linearGradient>
        <filter id="gulaSh" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.14"/>
        </filter>
      </defs>
      <!-- Pack -->
      <rect x="26" y="20" width="108" height="144" rx="10" fill="url(#gulakuGreen)" stroke="#14532D" stroke-width="2" filter="url(#gulaSh)"/>
      <rect x="30" y="24" width="100" height="136" rx="8" fill="none" stroke="#FACC15" stroke-width="1.5" stroke-dasharray="4 2"/>
      <!-- Farmer lady gold oval -->
      <ellipse cx="80" cy="62" rx="24" ry="24" fill="#FEF08A" stroke="#EAB308" stroke-width="2"/>
      <circle cx="80" cy="56" r="10" fill="#CA8A04"/>
      <path d="M 68 76 Q 80 66 92 76 Z" fill="#15803D"/>
      <!-- Gulaku text -->
      <text x="80" y="104" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="14" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">GULAKU</text>
      <text x="80" y="118" font-family="sans-serif" font-weight="800" font-size="8" fill="#FACC15" text-anchor="middle">GULA PASIR</text>
      <rect x="52" y="132" width="56" height="18" rx="4" fill="#FEF08A"/>
      <text x="80" y="145" font-family="sans-serif" font-weight="900" font-size="9" fill="#166534" text-anchor="middle">1 KG</text>
    </svg>
  `),

  // Kopi Kapal Api Special Mix (matching screenshot)
  'prod-7': svgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 180" width="160" height="180">
      <defs>
        <linearGradient id="kapalGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#991B1B"/>
          <stop offset="60%" stop-color="#7F1D1D"/>
          <stop offset="100%" stop-color="#111827"/>
        </linearGradient>
        <filter id="kopiSh" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.14"/>
        </filter>
      </defs>
      <!-- Pack -->
      <rect x="28" y="20" width="104" height="144" rx="8" fill="url(#kapalGrad)" stroke="#450A0A" stroke-width="2" filter="url(#kopiSh)"/>
      <!-- Oval Sailing Ship Logo -->
      <ellipse cx="80" cy="56" rx="30" ry="18" fill="#18181B" stroke="#FACC15" stroke-width="1.5"/>
      <path d="M 68 62 L 92 62 L 86 50 L 74 50 Z" fill="#FFFFFF"/>
      <path d="M 80 42 L 80 62" stroke="#FFFFFF" stroke-width="2"/>
      <!-- Kapal Api script font -->
      <text x="80" y="86" font-family="'Brush Script MT', cursive, sans-serif" font-weight="900" font-size="16" fill="#FACC15" text-anchor="middle">Kapal Api</text>
      <!-- White Coffee Cup -->
      <ellipse cx="80" cy="126" rx="24" ry="14" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
      <ellipse cx="80" cy="124" rx="18" ry="9" fill="#1C1917"/>
      <!-- Steam -->
      <path d="M 76 112 Q 78 104 74 98" stroke="#FFFFFF" stroke-width="1.5" fill="none" opacity="0.6"/>
      <path d="M 84 112 Q 82 104 86 98" stroke="#FFFFFF" stroke-width="1.5" fill="none" opacity="0.6"/>
    </svg>
  `),

  // Aqua Air Mineral
  'prod-8': svgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <rect width="120" height="120" rx="16" fill="#E0F2FE"/>
      <rect x="42" y="24" width="36" height="74" rx="8" fill="#38BDF8" opacity="0.6"/>
      <rect x="50" y="16" width="20" height="10" rx="2" fill="#0284C7"/>
      <rect x="38" y="50" width="44" height="24" rx="3" fill="#FFFFFF"/>
      <text x="60" y="64" font-family="system-ui, sans-serif" font-weight="900" font-size="10" fill="#0369A1" text-anchor="middle">AQUA</text>
      <text x="60" y="72" font-family="system-ui, sans-serif" font-weight="600" font-size="6" fill="#64748B" text-anchor="middle">600 ML</text>
    </svg>
  `),

  // Teh Celup Sosro
  'prod-9': svgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <rect width="120" height="120" rx="16" fill="#FEF3C7"/>
      <rect x="22" y="32" width="76" height="56" rx="8" fill="#D97706" stroke="#B45309" stroke-width="2"/>
      <circle cx="60" cy="56" r="16" fill="#FEF3C7"/>
      <text x="60" y="59" font-family="system-ui, sans-serif" font-weight="900" font-size="10" fill="#92400E" text-anchor="middle">SOSRO</text>
      <text x="60" y="80" font-family="system-ui, sans-serif" font-weight="800" font-size="7" fill="#FFFFFF" text-anchor="middle">TEH CELUP 30s</text>
    </svg>
  `),

  // Kecap Manis Bango
  'prod-10': svgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <rect width="120" height="120" rx="16" fill="#ECFDF5"/>
      <path d="M 34 28 L 86 28 L 80 96 L 40 96 Z" fill="#064E3B" rx="6"/>
      <circle cx="60" cy="52" r="16" fill="#F59E0B"/>
      <text x="60" y="56" font-family="system-ui, sans-serif" font-weight="900" font-size="9" fill="#064E3B" text-anchor="middle">BANGO</text>
      <text x="60" y="80" font-family="system-ui, sans-serif" font-weight="700" font-size="8" fill="#F8FAFC" text-anchor="middle">KECAP 520ML</text>
    </svg>
  `),

  // Saus Sambal ABC
  'prod-11': svgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <rect width="120" height="120" rx="16" fill="#FEE2E2"/>
      <path d="M 44 26 L 76 26 L 74 96 L 46 96 Z" fill="#DC2626" rx="6"/>
      <rect x="52" y="16" width="16" height="10" rx="2" fill="#FBBF24"/>
      <rect x="42" y="50" width="36" height="24" rx="4" fill="#FBBF24"/>
      <text x="60" y="64" font-family="system-ui, sans-serif" font-weight="900" font-size="10" fill="#991B1B" text-anchor="middle">ABC</text>
      <text x="60" y="72" font-family="system-ui, sans-serif" font-weight="700" font-size="6" fill="#78350F" text-anchor="middle">SAMBAL ASLI</text>
    </svg>
  `),

  // Masako Ayam
  'prod-12': svgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <rect width="120" height="120" rx="16" fill="#FEF08A"/>
      <rect x="22" y="24" width="76" height="72" rx="8" fill="#EAB308" stroke="#CA8A04" stroke-width="2"/>
      <rect x="30" y="40" width="60" height="28" rx="4" fill="#FFFFFF"/>
      <text x="60" y="58" font-family="system-ui, sans-serif" font-weight="900" font-size="11" fill="#DC2626" text-anchor="middle">Masako</text>
      <text x="60" y="80" font-family="system-ui, sans-serif" font-weight="800" font-size="8" fill="#78350F" text-anchor="middle">RASA AYAM</text>
    </svg>
  `),

  // Sabun Batang Lifebuoy
  'prod-13': svgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <rect width="120" height="120" rx="16" fill="#FEE2E2"/>
      <rect x="20" y="34" width="80" height="52" rx="12" fill="#E11D48" stroke="#BE123C" stroke-width="2"/>
      <rect x="30" y="46" width="60" height="26" rx="6" fill="#FFFFFF"/>
      <text x="60" y="62" font-family="system-ui, sans-serif" font-weight="900" font-size="10" fill="#E11D48" text-anchor="middle">Lifebuoy</text>
      <text x="60" y="78" font-family="system-ui, sans-serif" font-weight="700" font-size="7" fill="#FFFFFF" text-anchor="middle">TOTAL 10</text>
    </svg>
  `),

  // Rinso Deterjen
  'prod-14': svgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <rect width="120" height="120" rx="16" fill="#EFF6FF"/>
      <path d="M 28 32 L 92 32 L 84 94 L 36 94 Z" fill="#2563EB" rx="8"/>
      <rect x="32" y="44" width="56" height="32" rx="6" fill="#FFFFFF"/>
      <text x="60" y="60" font-family="system-ui, sans-serif" font-weight="900" font-size="12" fill="#1D4ED8" text-anchor="middle">Rinso</text>
      <text x="60" y="72" font-family="system-ui, sans-serif" font-weight="800" font-size="7" fill="#DC2626" text-anchor="middle">ANTI NODA 770G</text>
    </svg>
  `),

  // Sunlight Jeruk Nipis
  'prod-15': svgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <rect width="120" height="120" rx="16" fill="#ECFDF5"/>
      <path d="M 34 28 L 86 28 L 80 96 L 40 96 Z" fill="#16A34A" rx="8"/>
      <circle cx="60" cy="50" r="14" fill="#FACC15"/>
      <text x="60" y="54" font-family="system-ui, sans-serif" font-weight="900" font-size="8" fill="#15803D" text-anchor="middle">Sunlight</text>
      <text x="60" y="78" font-family="system-ui, sans-serif" font-weight="700" font-size="8" fill="#FEF08A" text-anchor="middle">JERUK NIPIS</text>
    </svg>
  `),

  // Roma Kelapa
  'prod-16': svgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <rect width="120" height="120" rx="16" fill="#FEF9C3"/>
      <rect x="20" y="32" width="80" height="56" rx="8" fill="#D97706" stroke="#B45309" stroke-width="2"/>
      <circle cx="44" cy="60" r="12" fill="#FEF08A"/>
      <text x="72" y="54" font-family="system-ui, sans-serif" font-weight="900" font-size="11" fill="#FFFFFF">Roma</text>
      <text x="72" y="68" font-family="system-ui, sans-serif" font-weight="800" font-size="8" fill="#FEF08A">KELAPA</text>
    </svg>
  `),

  // Tepung Segitiga Biru
  'prod-17': svgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <rect width="120" height="120" rx="16" fill="#F1F5F9"/>
      <rect x="28" y="24" width="64" height="74" rx="8" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
      <polygon points="60,42 42,68 78,68" fill="#2563EB"/>
      <text x="60" y="82" font-family="system-ui, sans-serif" font-weight="800" font-size="7" fill="#1E40AF" text-anchor="middle">SEGITIGA BIRU</text>
    </svg>
  `),

  // Susu Frisian Flag
  'prod-18': svgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <rect width="120" height="120" rx="16" fill="#FEF08A"/>
      <rect x="36" y="28" width="48" height="66" rx="10" fill="#2563EB" stroke="#1D4ED8" stroke-width="2"/>
      <rect x="40" y="44" width="40" height="28" rx="4" fill="#FFFFFF"/>
      <text x="60" y="56" font-family="system-ui, sans-serif" font-weight="900" font-size="8" fill="#2563EB" text-anchor="middle">FRISIAN</text>
      <text x="60" y="66" font-family="system-ui, sans-serif" font-weight="900" font-size="8" fill="#D97706" text-anchor="middle">GOLD</text>
    </svg>
  `),

  // Kerupuk Kaleng Putih (Barang warung tanpa barcode)
  'prod-19': svgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <rect width="120" height="120" rx="16" fill="#EFF6FF"/>
      <rect x="24" y="24" width="72" height="76" rx="8" fill="#3B82F6" stroke="#1D4ED8" stroke-width="2"/>
      <rect x="34" y="36" width="52" height="42" rx="4" fill="#FFFFFF" opacity="0.9"/>
      <ellipse cx="60" cy="56" rx="18" ry="14" fill="#FEF08A" stroke="#EAB308" stroke-width="1.5"/>
      <path d="M 48 56 Q 60 48 72 56 Q 60 64 48 56" fill="none" stroke="#CA8A04" stroke-width="1.5"/>
      <text x="60" y="90" font-family="system-ui, sans-serif" font-weight="900" font-size="8" fill="#FFFFFF" text-anchor="middle">KERUPUK KALENG</text>
    </svg>
  `),

  // Bawang Merah & Putih (Curah tanpa barcode)
  'prod-20': svgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <rect width="120" height="120" rx="16" fill="#FDF2F8"/>
      <ellipse cx="46" cy="62" rx="18" ry="22" fill="#BE185D"/>
      <path d="M 46 40 L 46 32" stroke="#BE185D" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="76" cy="66" rx="17" ry="20" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
      <path d="M 76 46 L 76 38" stroke="#94A3B8" stroke-width="3" stroke-linecap="round"/>
      <rect x="22" y="86" width="76" height="16" rx="4" fill="#831843"/>
      <text x="60" y="97" font-family="system-ui, sans-serif" font-weight="800" font-size="8" fill="#FDF2F8" text-anchor="middle">BAWANG MERAH</text>
    </svg>
  `),

  // Cabai Rawit Merah (Curah)
  'prod-21': svgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <rect width="120" height="120" rx="16" fill="#FEF2F2"/>
      <path d="M 40 40 Q 56 60 76 80 Q 72 88 64 84 Q 46 64 34 46 Z" fill="#DC2626" stroke="#991B1B" stroke-width="1.5"/>
      <path d="M 38 38 L 32 30" stroke="#15803D" stroke-width="4" stroke-linecap="round"/>
      <path d="M 68 34 Q 78 54 84 76 Q 80 82 72 78 Q 66 58 60 40 Z" fill="#EF4444"/>
      <rect x="26" y="86" width="68" height="16" rx="4" fill="#991B1B"/>
      <text x="60" y="97" font-family="system-ui, sans-serif" font-weight="800" font-size="8" fill="#FFFFFF" text-anchor="middle">CABAI RAWIT</text>
    </svg>
  `),

  // Tempe & Tahu
  'prod-22': svgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <rect width="120" height="120" rx="16" fill="#ECFDF5"/>
      <rect x="24" y="32" width="44" height="48" rx="6" fill="#15803D" stroke="#166534" stroke-width="2"/>
      <text x="46" y="58" font-family="system-ui, sans-serif" font-weight="900" font-size="8" fill="#DCFCE7" text-anchor="middle">TEMPE</text>
      <rect x="66" y="44" width="34" height="34" rx="4" fill="#FEF08A" stroke="#EAB308" stroke-width="1.5"/>
      <text x="83" y="64" font-family="system-ui, sans-serif" font-weight="900" font-size="8" fill="#854D0E" text-anchor="middle">TAHU</text>
      <rect x="26" y="86" width="68" height="16" rx="4" fill="#166534"/>
      <text x="60" y="97" font-family="system-ui, sans-serif" font-weight="800" font-size="8" fill="#FFFFFF" text-anchor="middle">TEMPE & TAHU</text>
    </svg>
  `),

  // Telur Butiran Eceran
  'prod-23': svgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <rect width="120" height="120" rx="16" fill="#FFFBEB"/>
      <ellipse cx="60" cy="56" rx="22" ry="30" fill="#D97706" stroke="#92400E" stroke-width="2"/>
      <ellipse cx="56" cy="46" rx="6" ry="10" fill="#FEF3C7" opacity="0.6"/>
      <rect x="22" y="86" width="76" height="16" rx="4" fill="#92400E"/>
      <text x="60" y="97" font-family="system-ui, sans-serif" font-weight="800" font-size="8" fill="#FFFBEB" text-anchor="middle">TELUR ECERAN</text>
    </svg>
  `),
};

// Ready-made Warung Preset Photos for quick product registration
export const WARUNG_PHOTO_PRESETS = [
  { id: 'preset-telur', name: 'Telur Ayam Segar', category: 'Sembako', image: productImages['prod-5'] },
  { id: 'preset-telur-butir', name: 'Telur Butiran Eceran', category: 'Sembako', image: productImages['prod-23'] },
  { id: 'preset-beras', name: 'Beras Super', category: 'Sembako', image: productImages['prod-3'] },
  { id: 'preset-minyak', name: 'Minyak Goreng', category: 'Sembako', image: productImages['prod-4'] },
  { id: 'preset-gula', name: 'Gula Pasir', category: 'Sembako', image: productImages['prod-6'] },
  { id: 'preset-kerupuk', name: 'Kerupuk Kaleng/Bawang', category: 'Makanan Ringan', image: productImages['prod-19'] },
  { id: 'preset-bawang', name: 'Bawang Merah / Putih', category: 'Bumbu & Dapur', image: productImages['prod-20'] },
  { id: 'preset-cabai', name: 'Cabai Rawit Merah', category: 'Bumbu & Dapur', image: productImages['prod-21'] },
  { id: 'preset-tempe', name: 'Tempe & Tahu Segar', category: 'Sembako', image: productImages['prod-22'] },
  { id: 'preset-indomie-grg', name: 'Indomie Goreng', category: 'Makanan Ringan', image: productImages['prod-1'] },
  { id: 'preset-indomie-kuah', name: 'Indomie Kuah', category: 'Makanan Ringan', image: productImages['prod-2'] },
  { id: 'preset-kopi', name: 'Kopi Sachet / Renceng', category: 'Minuman', image: productImages['prod-7'] },
  { id: 'preset-aqua', name: 'Air Mineral Botol', category: 'Minuman', image: productImages['prod-8'] },
  { id: 'preset-teh', name: 'Teh Celup / Kotak', category: 'Minuman', image: productImages['prod-9'] },
  { id: 'preset-kecap', name: 'Kecap Manis', category: 'Bumbu & Dapur', image: productImages['prod-10'] },
  { id: 'preset-sambal', name: 'Saus Sambal Botol', category: 'Bumbu & Dapur', image: productImages['prod-11'] },
  { id: 'preset-masako', name: 'Penyedap / Masako', category: 'Bumbu & Dapur', image: productImages['prod-12'] },
  { id: 'preset-sabun', name: 'Sabun Mandi Batang', category: 'Kebutuhan Rumah', image: productImages['prod-13'] },
  { id: 'preset-deterjen', name: 'Deterjen Bubuk / Cair', category: 'Kebutuhan Rumah', image: productImages['prod-14'] },
  { id: 'preset-sunlight', name: 'Sabun Cuci Piring', category: 'Kebutuhan Rumah', image: productImages['prod-15'] },
  { id: 'preset-biskuit', name: 'Biskuit / Camilan', category: 'Makanan Ringan', image: productImages['prod-16'] },
  { id: 'preset-tepung', name: 'Tepung Terigu', category: 'Sembako', image: productImages['prod-17'] },
  { id: 'preset-susu', name: 'Susu Kental Manis', category: 'Minuman', image: productImages['prod-18'] },
];

// Category fallback badges if no photo provided
export function getCategoryFallbackImage(category: string): string {
  switch (category) {
    case 'Sembako':
      return svgDataUrl(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
          <rect width="100" height="100" rx="14" fill="#F1F5F9"/>
          <path d="M 28 35 L 72 35 L 68 80 L 32 80 Z" fill="#E2E8F0" stroke="#94A3B8" stroke-width="2"/>
          <text x="50" y="62" font-family="system-ui, sans-serif" font-weight="800" font-size="12" fill="#475569" text-anchor="middle">SEMBAKO</text>
        </svg>
      `);
    case 'Minuman':
      return svgDataUrl(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
          <rect width="100" height="100" rx="14" fill="#E0F2FE"/>
          <rect x="36" y="24" width="28" height="56" rx="6" fill="#0284C7"/>
          <text x="50" y="56" font-family="system-ui, sans-serif" font-weight="800" font-size="11" fill="#FFFFFF" text-anchor="middle">MINUMAN</text>
        </svg>
      `);
    case 'Makanan Ringan':
      return svgDataUrl(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
          <rect width="100" height="100" rx="14" fill="#FEF3C7"/>
          <rect x="24" y="28" width="52" height="48" rx="8" fill="#F59E0B"/>
          <text x="50" y="56" font-family="system-ui, sans-serif" font-weight="800" font-size="11" fill="#FFFFFF" text-anchor="middle">SNACK</text>
        </svg>
      `);
    case 'Bumbu & Dapur':
      return svgDataUrl(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
          <rect width="100" height="100" rx="14" fill="#FEE2E2"/>
          <circle cx="50" cy="50" r="24" fill="#DC2626"/>
          <text x="50" y="54" font-family="system-ui, sans-serif" font-weight="800" font-size="11" fill="#FFFFFF" text-anchor="middle">BUMBU</text>
        </svg>
      `);
    default:
      return svgDataUrl(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
          <rect width="100" height="100" rx="14" fill="#F8FAFC"/>
          <circle cx="50" cy="50" r="22" fill="#10B981"/>
          <text x="50" y="54" font-family="system-ui, sans-serif" font-weight="800" font-size="10" fill="#FFFFFF" text-anchor="middle">PRODUK</text>
        </svg>
      `);
  }
}

export function getProductImage(product: { id: string; image?: string; category: string }): string {
  if (product.image) return product.image;
  if (productImages[product.id]) return productImages[product.id];
  return getCategoryFallbackImage(product.category);
}
