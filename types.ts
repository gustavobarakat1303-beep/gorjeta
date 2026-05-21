
// Adicionando enum Unit e UNIT_LABELS para resolver erros de importação nos módulos de operação e admin
export enum Unit {
  NOMADE = 'unit-nomade',
  PE_DE_MANGA = 'unit-manga'
}

export const UNIT_LABELS: Record<string, string> = {
  [Unit.NOMADE]: 'Nômade Coffee',
  [Unit.PE_DE_MANGA]: 'Pé de Manga'
};

export interface EstablishmentUnit {
  id: string;
  name: string;
  address: string;
  city: string;
  active: boolean;
  accessCode: string; // Senha de validação da unidade
  logoUrl?: string; // Campo para armazenamento do Base64 da imagem
  menuUrl?: string;
  reservationUrl?: string;
}

export enum VoucherStatus {
  ISSUED = 'issued',
  ACTIVE = 'active',
  USED = 'used'
}

export enum EligibilityMode {
  WHITELIST = 'whitelist',
  PUBLIC = 'public'
}

export type BenefitType = 'fixed_amount' | 'percent';

export interface CampaignMonth {
  id: string;
  month: string;
  limit: number;
  issued_count: number;
  used_count: number;
}

export interface Campaign {
  id: string;
  name: string;
  partner: string;
  value: number; // Valor legado/fallback
  totalLimit: number;
  monthlyLimit: number;
  hardStopDate: string;
  active: boolean;
  eligibilityMode: EligibilityMode;
  requirePreRegisteredPhone: boolean;
  allowedUnits: string[]; 
  limitPerCodePerMonth: number;
  months: CampaignMonth[];
  monthlyUsageLimit?: number;
  voucherValidityDays?: number;
  // Novos campos
  rules_text?: string;
  partner_logo_url?: string;
  contractor?: string; // Nome da empresa que paga o benefício (ex: UOL, SAP)
  contractor_logo_url?: string;
  benefit_type?: BenefitType;
  benefit_value?: number;
}

export interface WhitelistEntry {
  code: string; // Will now store essentially the identifier (Name + Date) or just unique code
  name: string;
  birthDate?: string;
  phone?: string;
  campaignId?: string;
}

export interface Voucher {
  id: string;
  code: string; // Código curto do voucher (ex: UOL-ABC123)
  customerCode: string; // Identificação do colaborador (Nome/Data)
  name: string;
  campaignId: string;
  status: VoucherStatus;
  issuedAt: string;
  usedAt?: string;
  usedStore?: string; // ID da Unidade
  customerCodeHash?: string;
  batchId?: string;
  qrToken?: string;
  expiryDate: string;
  signature?: string;
  usedByUnit?: string; // ID da Unidade
  usedByOperatorId?: string;
}

export interface Partner {
  id: string;
  name: string;
  accessCode: string;
  active: boolean;
  logoUrl?: string;
  createdAt: string;
  responsibleName?: string;
  responsibleEmail?: string;
  responsiblePhone?: string;
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'operator' | 'contractor';
  unit?: string; // ID da Unidade
  partner?: string; // Nome do parceiro (ex: 'UOL')
}