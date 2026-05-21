
import React, { useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import ContractorDashboard from '../pages/ContractorDashboard';
import { User, Partner } from '../types';
import { db, firestore, normalizeString } from '../services/dataService';
import { Building2, ChevronLeft, Lock, ArrowRight, RefreshCw, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ContractorModule: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('partnerSession');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (u: User) => {
    localStorage.setItem('partnerSession', JSON.stringify(u));
    setUser(u);
  };

  if (!user) {
    return <ContractorLogin onLogin={handleLogin} />;
  }

  return (
    <Routes>
      <Route path="/" element={<ContractorDashboard user={user} />} />
    </Routes>
  );
};

const ContractorLogin: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [partnerName, setPartnerName] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const slugInput = normalizeString(partnerName).toLowerCase();
      
      // 1. Procura primeiro no cache local
      let partner = db.partners.all().find(p => p.id === slugInput || normalizeString(p.name).toLowerCase() === slugInput);
      
      // 2. Se não estiver no cache local, tenta buscar no Firestore direto
      if (!partner && slugInput) {
        try {
          const { doc, getDoc } = await import('firebase/firestore');
          const docSnap = await getDoc(doc(firestore, 'partners', slugInput));
          if (docSnap.exists()) {
            partner = { id: docSnap.id, ...docSnap.data() } as Partner;
            db.partners.save(partner, false); // Salva localmente
          }
        } catch (e) {
          console.error("Firestore direct lookup error during login:", e);
        }
      }

      // 3. Busca inteligente tolerante a variações por meio da lista pública de campanhas
      if (!partner) {
        try {
          const typedNormalized = normalizeString(partnerName);
          if (typedNormalized) {
            // Varre as campanhas públicas (que são sincronizadas em tempo real para todos na inicialização)
            const campaignsMatching = db.campaigns.all().filter(c => {
              const contractorNorm = c.contractor ? normalizeString(c.contractor) : "";
              const partnerNorm = c.partner ? normalizeString(c.partner) : "";
              return (
                (contractorNorm && (contractorNorm.includes(typedNormalized) || typedNormalized.includes(contractorNorm))) ||
                (partnerNorm && (partnerNorm.includes(typedNormalized) || typedNormalized.includes(partnerNorm)))
              );
            });
            
            // Se encontrou alguma campanha cujo parceiro casa, tentamos o slug daquele parceiro
            for (const camp of campaignsMatching) {
              const candidateNames = [camp.contractor, camp.partner].filter(Boolean) as string[];
              for (const candName of candidateNames) {
                const altSlug = normalizeString(candName).toLowerCase();
                if (altSlug !== slugInput) {
                  const { doc, getDoc } = await import('firebase/firestore');
                  const docSnap = await getDoc(doc(firestore, 'partners', altSlug));
                  if (docSnap.exists()) {
                    partner = { id: docSnap.id, ...docSnap.data() } as Partner;
                    db.partners.save(partner, false);
                    break;
                  }
                }
              }
              if (partner) break;
            }
          }
        } catch (e) {
          console.error("Firestore intelligent campaign-matching error during login:", e);
        }
      }

      if (partner) {
        const cleanSavedCode = normalizeString(partner.accessCode);
        const cleanTypedCode = normalizeString(accessCode);

        if (cleanSavedCode !== cleanTypedCode) {
          toast.error('Código de Acesso inválido.');
          setLoading(false);
          return;
        }
        if (!partner.active) {
          toast.error('O acesso para esta empresa está temporariamente bloqueado.');
          setLoading(false);
          return;
        }

        onLogin({
          id: partner.id,
          username: `${partner.name.toLowerCase()}_admin`,
          role: 'contractor',
          partner: partner.name
        });
        toast.success(`Acesso autorizado para ${partner.name}`);
      } else {
        toast.error('Empresa ou Código de Acesso inválidos.');
      }
    } catch (err) {
      toast.error('Erro ao processar login.');
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
