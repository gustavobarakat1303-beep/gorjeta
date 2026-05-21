
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { initializeDB } from './services/dataService';
import ClientModule from './modules/ClientModule';
import OperationModule from './modules/OperationModule';
import AdminModule from './modules/AdminModule';
import AgentModule from './modules/AgentModule';
import ContractorModule from './modules/ContractorModule';
import PublicVoucher from './modules/PublicVoucher';
import MenuAndReservations from './modules/MenuAndReservations';
import ManualModule from './modules/ManualModule';
import PartnerGuideModule from './modules/PartnerGuideModule';
import HRGuideModule from './modules/HRGuideModule';
import BeneficiaryGuideModule from './modules/BeneficiaryGuideModule';
import { Toaster } from 'react-hot-toast';
import { Ticket, Settings, ShieldCheck, Bot, LayoutGrid, ChevronRight, Building2, Download, Utensils } from 'lucide-react';

const App: React.FC = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => { 
    const init = async () => {
      try {
        await initializeDB();
      } catch (e) {
        console.error("Critical Initialization Error:", e);
      } finally {
        setIsReady(true);
      }
    };
    init();
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-center">
            <p className="font-black text-slate-400 uppercase tracking-widest text-[10px] mb-2">Sincronizando com a Nuvem...</p>
            <p className="text-[9px] text-slate-300 font-medium">Isso garante que você veja a versão mais recente da campanha.</p>
          </div>
          <button 
            onClick={() => setIsReady(true)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
          >
            Pular Sincronização
          </button>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <Toaster position="top-right" />
        <Routes>
          <Route path="/cliente/*" element={<ClientModule />} />
          <Route path="/operacao/*" element={<OperationModule />} />
          <Route path="/admin/*" element={<AdminModule />} />
          <Route path="/agente/*" element={<AgentModule />} />
          <Route path="/contratante/*" element={<ContractorModule />} />
          <Route path="/v/:code" element={<PublicVoucher />} />
          <Route path="/cardapio" element={<MenuAndReservations />} />
          <Route path="/manual" element={<ManualModule />} />
          <Route path="/guia-parceiro" element={<PartnerGuideModule />} />
          <Route path="/guia-rh" element={<HRGuideModule />} />
          <Route path="/guia-beneficiario" element={<BeneficiaryGuideModule />} />
          <Route path="/" element={<HomeSelection />} />
        </Routes>
      </div>
    </HashRouter>
  );
};

const HomeSelection = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-slate-50 to-slate-100">
      {deferredPrompt && (
        <button 
          onClick={handleInstall}
          className="fixed bottom-8 right-8 bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black shadow-2xl flex items-center gap-2 animate-bounce z-50 hover:bg-indigo-700 transition-all"
        >
          <Download size={20} /> Instalar App
        </button>
      )}
      <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-indigo-200 animate-bounce">
      <Ticket className="text-white w-10 h-10" />
    </div>
    
    <div className="mb-12 text-center">
      <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter">VoucherHub</h1>
      <p className="text-slate-500 max-w-md mx-auto font-medium text-lg leading-relaxed">
        Plataforma inteligente de gestão de benefícios e validação em tempo real.
      </p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
      <HomeCard 
        to="/cliente" 
        icon={<LayoutGrid className="w-10 h-10 text-indigo-500" />} 
        title="Benefícios" 
        desc="Vitrine e resgate para colaboradores." 
        accent="indigo"
      />

      <HomeCard 
        to="/cardapio" 
        icon={<Utensils className="w-10 h-10 text-rose-500" />} 
        title="Cardápio & Reservas" 
        desc="Consulte cardápios e reserve sua mesa." 
        accent="rose"
      />
      
      <HomeCard 
        to="/agente" 
        icon={<Bot className="w-10 h-10 text-violet-500" />} 
        title="Agente de IA" 
        desc="Atendimento e registro via linguagem natural." 
        accent="violet"
      />

      <HomeCard 
        to="/contratante" 
        icon={<Building2 className="w-10 h-10 text-sky-500" />} 
        title="Empresa Parceira" 
        desc="Gestão de campanhas e base de funcionários." 
        accent="sky"
      />

      <HomeCard 
        to="/operacao" 
        icon={<ShieldCheck className="w-10 h-10 text-emerald-500" />} 
        title="Operação PDV" 
        desc="Validação de vouchers nas unidades." 
        accent="emerald"
      />
      
      <HomeCard 
        to="/admin" 
        icon={<Settings className="w-10 h-10 text-amber-500" />} 
        title="Painel Admin" 
        desc="Gestão de campanhas e auditoria total." 
        accent="amber"
      />

      <HomeCard 
        to="/guia-beneficiario" 
        icon={<Bot className="w-10 h-10 text-indigo-400" />} 
        title="Guia Beneficiário" 
        desc="Aprenda a usar seus benefícios." 
        accent="indigo"
      />
      
      <HomeCard 
        to="/guia-rh" 
        icon={<LayoutGrid className="w-10 h-10 text-indigo-600" />} 
        title="Guia do RH" 
        desc="Como gerenciar sua equipe." 
        accent="indigo"
      />
    </div>

    <footer className="mt-20 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
      VoucherHub Enterprise &bull; v2.0
    </footer>
  </div>
  );
};

const HomeCard = ({ to, icon, title, desc, accent }: any) => {
  const themes: any = {
    indigo: "hover:border-indigo-500 hover:shadow-indigo-100 bg-white",
    violet: "hover:border-violet-500 hover:shadow-violet-100 bg-white",
    emerald: "hover:border-emerald-500 hover:shadow-emerald-100 bg-white",
    amber: "hover:border-amber-500 hover:shadow-amber-100 bg-white",
    sky: "hover:border-sky-500 hover:shadow-sky-100 bg-white",
    rose: "hover:border-rose-500 hover:shadow-rose-100 bg-white"
  };

  return (
    <Link to={to} className={`group p-8 border border-slate-200 rounded-[2.5rem] shadow-sm transition-all duration-300 text-left flex flex-col h-full transform hover:-translate-y-2 ${themes[accent]}`}>
      <div className="mb-6 p-4 rounded-2xl bg-slate-50 w-fit group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-black mb-2 text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed font-medium mb-6 flex-1">{desc}</p>
      <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-600 transition-colors">
        Acessar Módulo <ChevronRight className="ml-1 w-3 h-3" />
      </div>
    </Link>
  );
};

export default App;
