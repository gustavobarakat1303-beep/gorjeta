
import { Unit, Campaign, CampaignMonth, EligibilityMode } from './types';

// HMAC key for QR simulation (never expose in real apps)
export const QR_SECRET = 'v0uch3r-hUb-s3cr3t-2026';

const generateUolMonths = (): CampaignMonth[] => {
  const months: CampaignMonth[] = [];
  const startYear = 2026;
  const startMonth = 2; // February

  for (let i = 0; i < 12; i++) {
    const currentYear = startYear + Math.floor((startMonth + i - 1) / 12);
    const currentMonth = ((startMonth + i - 1) % 12) + 1;
    const monthStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    
    months.push({
      id: `uol-m-${monthStr}`,
      month: monthStr,
      limit: 55,
      issued_count: 0,
      used_count: 0
    });
  }
  return months;
};

export const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-uol-2026',
    name: 'UOL Experience',
    partner: 'UOL',
    value: 270.00,
    eligibilityMode: EligibilityMode.WHITELIST,
    requirePreRegisteredPhone: true,
    allowedUnits: [Unit.NOMADE],
    totalLimit: 660,
    monthlyLimit: 55, // Ensure mandatory monthlyLimit is included
    hardStopDate: '2027-01-30T23:59:59',
    limitPerCodePerMonth: 1,
    months: generateUolMonths(),
    active: true
  }
];

export const MOCK_OPERATORS = [
  { id: 'op1', username: 'ana.nomade', role: 'operator' as const, unit: Unit.NOMADE },
  { id: 'op2', username: 'carlos.manga', role: 'operator' as const, unit: Unit.PE_DE_MANGA },
  { id: 'adm1', username: 'admin', role: 'admin' as const }
];