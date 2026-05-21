
import React, { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import ContractorDashboard from '../pages/ContractorDashboard';
import { User, Partner } from '../types';
import { db, normalizeString, findPartnerByInput } from '../services/dataService';
import { Building2, ChevronLeft, Lock, ArrowRight, RefreshCw, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const PARTNER_SESSION_KEY = 'partnerSession';
const PARTNER_SESSION_VERSION = 2;

interface PersistedPartnerSession {
  v: number;
  user: User;
  partner: Partner;
  issuedAt: number;
}

const readPartnerSession = (): PersistedPartnerSession | null => {
  try {
    const raw = localStorage.getItem(PARTNER_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    if (parsed && parsed.v === PARTNER_SESSION_VERSION && parsed.user && parsed.partner) {
      return parsed as PersistedPartnerSession;
    }

    // Legacy session (pre-fix): just a User object. Upgrade in place if possible.
    if (parsed && parsed.id && parsed.role === 'contractor') {
      const cached = db.partners.getById(parsed.id);
      if (cached) {
        const upgraded: PersistedPartnerSession = {
          v: PARTNER_SESSION_VERSION,
          user: parsed as User,
          partner: cached,
          issuedAt: Date.now()
        };
        localStorage.setItem(PARTNER_SESSION_KEY, JSON.stringify(upgraded));
        return upgraded;
      }
      // No cached partner yet — keep the legacy session alive, the dashboard
      // will hydrate it. Synthesize a minimal partner stub.
      const stub: Partner = {
        id: parsed.id,
        name: parsed.partner || parsed.id,
        accessCode: '',
        active: true,
        createdAt: new Date(0).toISOString()
      };
      return {
        v: PARTNER_SESSION_VERSION,
        user: parsed as User,
        partner: stub,
        issuedAt: Date.now()
      };
    }
  } catch (e) {
    console.warn('[PARTNER_SESSION] failed to parse session, clearing.', e);
    localStorage.removeItem(PARTNER_SESSION_KEY);
  }
  return null;
};

export const clearPartnerSession = () => {
  localStorage.removeItem(PARTNER_SESSION_KEY);
};

export const writePartnerSession = (user: User, partner: Partner) => {
  const payload: PersistedPartnerSession = {
    v: PARTNER_SESSION_VERSION,
    user,
    partner,
    issuedAt: Date.now()
  };
  localStorage.setItem(PARTNER_SESSION_KEY, JSON.stringify(payload));
};

const ContractorModule: React.FC = () => {
  const [session, setSession] = useState<PersistedPartnerSession | null>(() => readPartnerSession());

  const handleLogin = (user: User, partner: Partner) => {
    writePartnerSession(user, partner);
    setSession({ v: PARTNER_SESSION_VERSION, user, partner, issuedAt: Date.now() });
  };

  if (!session) {
    return <ContractorLogin onLogin={handleLogin} />;
  }

  return (
    <Routes>
      <Route path="/" element={<ContractorDashboard user={session.user} />} />
    </Routes>
  );
};

const ContractorLogin: React.FC<{ onLogin: (user: User, partner: Partner) => void }> = ({ onLogin }) => {
  const [partnerName, setPartnerName] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const trimmedName = partnerName.trim();
    const trimmedCode = accessCode.trim();
    if (!trimmedName || !trimmedCode) {
      toast.error('Informe o nome da empresa e o código de acesso.');
      return;
    }

    setLoading(true);

    try {
      const result = await findPartnerByInput(trimmedName);

      if (result.status === 'network_error') {
        toast.error('Falha de conexão. Verifique sua internet e tente novamente.');
        return;
      }

      if (result.status === 'not_found') {
        toast.error('Empresa não encontrada. Confira o nome cadastrado.');
        return;
      }

      const partner = result.partner;
      const cleanSavedCode = normalizeString(partner.accessCode || '');
      const cleanTypedCode = normalizeString(trimmedCode);

      if (!cleanSavedCode) {
        toast.error('Esta empresa não possui código de acesso configurado. Contate o administrador.');
        return;
      }

      if (cleanSavedCode !== cleanTypedCode) {
        toast.error('Código de Acesso inválido.');
        return;
      }

      if (!partner.active) {
        toast.error('O acesso para esta empresa está temporariamente bloqueado.');
        return;
      }

      // Persist the canonical partner record locally so the dashboard never
      // has to re-resolve it on mount (the previous behavior could log the
      // user out on the first transient Firestore glitch).
      db.partners.save(partner, false);

      onLogin(
        {
          id: partner.id,
          username: `${(partner.name || partner.id).toLowerCase()}_admin`,
          role: 'contractor',
          partner: partner.name
        },
        partner
      );
      toast.success(`Acesso autorizado para ${partner.name}`);
    } catch (err) {
      console.error('[CONTRACTOR_LOGIN] unexpected error:', err);
      toast.error('Erro ao processar login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-80 h-80 bg-indigo-600/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-violet-600/20 rounded-full blur-[120px]"></div>

      <Link to="/" className="absolute top-8 left-8 text-slate-400 hover:text-white transition-all flex items-center gap-2 font-bold text-sm">
        <ChevronLeft size={20} /> Voltar para Home
      </Link>

      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-10 md:p-12 relative z-10">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-indigo-200">
          <Building2 className="text-white" size={32} />
        </div>

        <div className="mb-10">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Painel da Empresa</h2>
          <p className="text-slate-500 font-medium">Gestão de benefícios para seus colaboradores.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Empresa</label>
            <input 
              type="text" 
              placeholder="Ex: FIAT, UOL, XP" 
              value={partnerName}
              onChange={e => setPartnerName(e.target.value)}
              className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 outline-none font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Código de Acesso</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={accessCode}
                onChange={e => setAccessCode(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 outline-none font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="animate-spin" size={18} />
            ) : (
              <>Acessar Painel <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
            )}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-slate-100 text-center space-y-4">
          <Link to="/guia-rh" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-all">
             <HelpCircle size={14} /> Primeiro acesso? Veja o Guia
          </Link>
          <p className="text-xs text-slate-400 font-medium">
            Problemas com o acesso? <br />
            <span className="text-indigo-600 font-bold cursor-pointer hover:underline">Contate o suporte VoucherHub</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContractorModule;
