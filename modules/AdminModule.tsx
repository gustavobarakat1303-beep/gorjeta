
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { db, useDataSync, subscribe, loginAdmin, auth, logout, normalizeString, normalizeDate } from '../services/dataService';
import { WhitelistEntry, Voucher, VoucherStatus, Campaign, EligibilityMode, EstablishmentUnit, BenefitType, Partner } from '../types';
import toast from 'react-hot-toast';
import { 
  Users, Ticket, Trash2, Database, UploadCloud, Clock, Briefcase,
  X, Plus, Edit3, Power, Save, Store, MapPin, Image as ImageIcon, FileSpreadsheet, Info, Menu, Camera, LogOut, Home, ChevronLeft,
  ExternalLink, Copy, LayoutGrid, Building2, RefreshCw, LogIn, ShieldCheck, Download, Utensils, CalendarDays, HelpCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';

const AdminModule = () => {
  useDataSync();
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = localStorage.getItem('adminSession');
    return saved ? JSON.parse(saved) : auth.currentUser;
  });
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'audit' | 'campaigns' | 'units' | 'partners' | 'team'>('audit');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [importErrors, setImportErrors] = useState<{line: number, error: string}[]>([]);
  
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  
  const maskPhone = (val: string) => {
    let v = val.replace(/\D/g, "");
    if (v.length > 11) v = v.substring(0, 11);
    if (v.length > 10) v = v.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    else if (v.length > 6) v = v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,5}).*/, "($1) $2");
    else v = v.replace(/^(\d*)/, "($1");
    return v;
  };

  const maskDate = (val: string) => {
    let v = val.replace(/\D/g, "");
    if (v.length > 8) v = v.substring(0, 8);
    if (v.length > 4) v = v.replace(/^(\d{2})(\d{2})(\d{0,4}).*/, "$1/$2/$3");
    else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,2}).*/, "$1/$2");
    return v;
  };

  const handleDownloadTemplate = () => {
    const data = [
      { 'Nome Completo': 'João da Silva', 'Data Nascimento': '15/10/1985', 'Celular': '(11) 98888-7777' },
      { 'Nome Completo': 'Maria Oliveira', 'Data Nascimento': '22/03/1990', 'Celular': '(11) 97777-6666' }
    ];
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "template_importacao_vouchers.xlsx");
    toast.success("Template baixado!");
  };
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [units, setUnits] = useState<EstablishmentUnit[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [admins, setAdmins] = useState<{id: string, email: string}[]>([]);
  // True after we've waited long enough for the admins listener to either
  // populate the cache or definitively fail. Until then we don't show the
  // "Acesso Restrito" screen, because the user's UID may legitimately be
  // in /admins but the snapshot just hasn't arrived yet.
  const [adminGraceElapsed, setAdminGraceElapsed] = useState(false);
  const [showAdminAdd, setShowAdminAdd] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ email: '', uid: '' });

  const [editingCampaign, setEditingCampaign] = useState<Partial<Campaign> | null>(null);
  const [editingUnit, setEditingUnit] = useState<Partial<EstablishmentUnit> | null>(null);
  const [editingPartner, setEditingPartner] = useState<Partial<Partner> | null>(null);
  const [editingWhitelist, setEditingWhitelist] = useState<Partial<WhitelistEntry> | null>(null);
  
  const loadData = useCallback(() => {
    setVouchers(db.vouchers.all());
    setWhitelist(db.whitelist.all());
    setCampaigns(db.campaigns.all());
    setUnits(db.units.all());
    setPartners(db.partners.all());
    setAdmins(db.admins.all());
  }, []);

  // Monitorar auth
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      console.log("[ADMIN] Auth State Change:", user?.email);
      if (user) {
        setCurrentUser(user);
      } else {
        const saved = localStorage.getItem('adminSession');
        if (saved) {
          setCurrentUser(JSON.parse(saved));
        } else {
          setCurrentUser(null);
        }
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Re-carrega dados quando houver sincronização em tempo real
  useEffect(() => {
    if (currentUser) {
      const unsub = subscribe(() => loadData());
      return () => unsub();
    }
  }, [currentUser, loadData]);

  // Race condition fix: when a non-master admin signs in, the /admins
  // listener (in dataService.initializeDB) needs a moment to deliver the
  // first snapshot. Until then `admins.length === 0` and `isAuthorized`
  // would be false, kicking the legitimate admin to "Acesso Restrito".
  // We wait up to 4s, or as soon as any admin entry shows up, whichever
  // comes first.
  useEffect(() => {
    if (!currentUser) {
      setAdminGraceElapsed(false);
      return;
    }
    setAdminGraceElapsed(false);
    const timeout = window.setTimeout(() => setAdminGraceElapsed(true), 4000);
    return () => window.clearTimeout(timeout);
  }, [currentUser?.uid]);

  useEffect(() => {
    if (admins.length > 0) setAdminGraceElapsed(true);
  }, [admins.length]);

  useEffect(() => {
    if (currentUser) loadData();
  }, [currentUser, loadData]);

  const masterEmail = 'gustavobarakat1303@gmail.com';
  const isMaster = currentUser?.email?.toLowerCase() === masterEmail.toLowerCase();
  const isAuthorized = isMaster || (admins && admins.some(a => a.id === currentUser?.uid));

  // Migrar parceiros para o padrão de slug no ID
  useEffect(() => {
    if (isAuthorized && partners.length > 0) {
      let migrated = false;
      partners.forEach(p => {
        const canonicalSlug = normalizeString(p.name).toLowerCase();
        if (p.id !== canonicalSlug) {
          console.log(`[MIGRATION] Migrando parceiro ${p.name} de ID ${p.id} para ID canonical ${canonicalSlug}`);
          db.partners.save({ ...p, id: canonicalSlug });
          db.partners.delete(p.id);
          migrated = true;
        }
      });
      if (migrated) {
        loadData();
      }
    }
  }, [isAuthorized, partners, loadData]);

  const handleLogout = () => {
    localStorage.removeItem('adminSession');
    logout();
    setCurrentUser(null);
    toast.success('Sessão encerrada com sucesso!');
  };

  const filteredVouchers = vouchers.filter(v => 
    v.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.customerCode?.toUpperCase().includes(searchTerm.toUpperCase()) ||
    v.code?.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice().reverse();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <RefreshCw className="text-indigo-500 animate-spin mb-4" size={32} />
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] mb-2">Validando Acesso...</p>
        <p className="text-slate-600 text-[10px] max-w-xs leading-relaxed mb-6">
          Verificando credenciais e sincronizando com a nuvem...
        </p>
        
        <div className="pt-6 border-t border-slate-800 w-full max-w-xs space-y-4">
           <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Se demorar mais de 10 segundos:</p>
           <button 
             onClick={() => window.location.reload()} 
             className="w-full py-3 bg-slate-800 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all flex items-center justify-center gap-2"
           >
             <RefreshCw size={14} /> Recarregar Página
           </button>
           <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
              <p className="text-slate-500 text-[9px] italic">
                Dica: Certifique-se que o domínio <span className="text-indigo-400">{window.location.hostname}</span> está autorizado no Console do Firebase (Authentication {'>'} Settings).
              </p>
           </div>
        </div>
      </div>
    );
  }

  if (!currentUser) return <AdminLogin onLogin={(user: any) => {
    localStorage.setItem('adminSession', JSON.stringify(user));
    setCurrentUser(user);
  }} />;

  // Wait for the /admins snapshot to land before deciding the user is
  // unauthorized — otherwise we kick legitimate admins to "Acesso Restrito"
  // while their permission record is still in flight. The master is exempt
  // because the check is purely on the hardcoded email.
  if (!isAuthorized && !isMaster && !adminGraceElapsed) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <RefreshCw className="text-indigo-500 animate-spin mb-4" size={32} />
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] mb-2">Validando Permissões...</p>
        <p className="text-slate-600 text-[10px] max-w-xs leading-relaxed">
          Conferindo seu acesso administrativo na nuvem...
        </p>
      </div>
    );
  }

  if (!isAuthorized) {
    // Se logado mas não autorizado
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-amber-500/20 rounded-[2rem] flex items-center justify-center mb-8 border border-amber-500/20 shadow-2xl shadow-amber-500/10">
          <ShieldCheck size={40} className="text-amber-500" />
        </div>
        <h1 className="text-3xl font-black text-white mb-2 tracking-tighter">Acesso Restrito</h1>
        <p className="text-slate-400 mb-8 max-w-sm font-medium leading-relaxed">
          Você está logado como <span className="text-white">{currentUser.email}</span>, mas não possui permissões administrativas para este painel.
        </p>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button onClick={handleLogout} className="w-full py-4 bg-white text-slate-950 rounded-2xl font-black shadow-xl hover:bg-slate-100 transition-all active:scale-95">
            Entrar com outra conta
          </button>
          <Link to="/" className="w-full py-4 bg-slate-800 text-slate-400 rounded-2xl font-black hover:text-white transition-all">
            Voltar para o Início
          </Link>
        </div>
      </div>
    );
  }

  const handleSpreadsheetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportErrors([]);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { raw: false });
        
        const errors: {line: number, error: string}[] = [];
        const entries = json.map((row: any, index: number): WhitelistEntry | null => {
          const line = index + 2; // +1 for 0-index, +1 for header
          const keys = Object.keys(row);
          const nameKey = keys.find(k => k.toLowerCase().includes('nome') || k.toLowerCase().includes('completo'));
          const birthKey = keys.find(k => k.toLowerCase().includes('nasci') || k.toLowerCase().includes('data') || k.toLowerCase().includes('aniver'));
          const phoneKey = keys.find(k => k.toLowerCase().includes('tel') || k.toLowerCase().includes('cel') || k.toLowerCase().includes('fone') || k.toLowerCase().includes('whatsapp'));
          
          if (!nameKey || !row[nameKey]) {
            errors.push({ line, error: "Nome não encontrado ou vazio" });
            return null;
          }
          if (!birthKey || !row[birthKey]) {
            errors.push({ line, error: "Data de nascimento não encontrada ou vazia" });
            return null;
          }

          const rawName = String(row[nameKey]).trim();
          const rawBirth = String(row[birthKey]).trim();
          const rawPhone = phoneKey ? String(row[phoneKey]).trim() : '';

          if (rawName.length < 3) {
            errors.push({ line, error: "Nome muito curto (mínimo 3 letras)" });
            return null;
          }

          const normalizedDate = normalizeDate(rawBirth);
          if (normalizedDate.length !== 8) {
            errors.push({ line, error: `Data inválida: "${rawBirth}". Use DD/MM/AAAA` });
            return null;
          }

          const normalizedName = normalizeString(rawName);
          const normalizedId = `${normalizedName}_${normalizedDate}`;
          return { code: normalizedId, name: rawName, birthDate: rawBirth, phone: rawPhone };
        }).filter((item): item is WhitelistEntry => item !== null);

        if (errors.length > 0) {
          setImportErrors(errors);
        }

        if (entries.length > 0) {
          db.whitelist.addBatch(entries);
          toast.success(`${entries.length} colaboradores importados!`);
          loadData();
          e.target.value = '';
          if (errors.length > 0) {
            toast.error(`${errors.length} linhas apresentaram erro.`);
          }
        } else if (errors.length > 0) {
          toast.error("Nenhum dado válido pôde ser importado.");
        } else {
          toast.error("Nenhum dado encontrado no arquivo.");
        }
      } catch (err) { toast.error("Falha técnica ao processar arquivo"); }
    };
    reader.readAsArrayBuffer(file);
  };

  const saveCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;
    const campaignToSave: Campaign = {
      id: editingCampaign.id || `camp-${Math.random().toString(36).substr(2, 9)}`,
      name: editingCampaign.name || '',
      partner: editingCampaign.partner || '',
      value: Number(editingCampaign.benefit_value) || editingCampaign.value || 0,
      totalLimit: Number(editingCampaign.totalLimit) || 1000,
      monthlyLimit: Number(editingCampaign.monthlyLimit) || 100,
      hardStopDate: editingCampaign.hardStopDate || '2027-12-31T23:59:59',
      active: editingCampaign.active ?? true,
      eligibilityMode: editingCampaign.eligibilityMode || EligibilityMode.WHITELIST,
      requirePreRegisteredPhone: false,
      allowedUnits: editingCampaign.allowedUnits || [],
      limitPerCodePerMonth: Number(editingCampaign.limitPerCodePerMonth) || 1,
      monthlyUsageLimit: Number(editingCampaign.monthlyUsageLimit) || Number(editingCampaign.monthlyLimit) || 100,
      months: editingCampaign.months || [],
      rules_text: editingCampaign.rules_text || '',
      partner_logo_url: editingCampaign.partner_logo_url || '',
      contractor_logo_url: editingCampaign.contractor_logo_url || '',
      benefit_type: editingCampaign.benefit_type || 'fixed_amount',
      benefit_value: Number(editingCampaign.benefit_value) || 0,
      voucherValidityDays: Number(editingCampaign.voucherValidityDays) || 0
    };

    // Garantir que o mês atual existe no estoque se houver limite mensal
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    if (!campaignToSave.months.find(m => m.month === currentMonthStr)) {
      campaignToSave.months.push({
        id: `month-${Math.random().toString(36).substr(2, 9)}`,
        month: currentMonthStr,
        limit: campaignToSave.monthlyLimit,
        issued_count: 0,
        used_count: 0
      });
    } else {
      // Atualizar o limite do mês atual se ele já existir
      const mIdx = campaignToSave.months.findIndex(m => m.month === currentMonthStr);
      campaignToSave.months[mIdx].limit = campaignToSave.monthlyLimit;
    }
    db.campaigns.save(campaignToSave);
    toast.success('Campanha salva!');
    loadData();
    setEditingCampaign(null);
  };

  const saveUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnit) return;
    const unitToSave: EstablishmentUnit = {
      id: editingUnit.id || `unit-${Math.random().toString(36).substr(2, 9)}`,
      name: editingUnit.name || '',
      address: editingUnit.address || '',
      city: editingUnit.city || '',
      active: editingUnit.active ?? true,
      accessCode: editingUnit.accessCode || Math.random().toString(36).substr(2, 6).toUpperCase(),
      logoUrl: editingUnit.logoUrl || '',
      menuUrl: editingUnit.menuUrl || '',
      reservationUrl: editingUnit.reservationUrl || ''
    };
    db.units.save(unitToSave);
    toast.success('Unidade salva!');
    loadData();
    setEditingUnit(null);
  };

  const savePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner) return;

    // Verificar nome único
    const allPartners = db.partners.all();
    const duplicate = allPartners.find(p => 
      p.name.trim().toLowerCase() === editingPartner.name?.trim().toLowerCase() && 
      p.id !== editingPartner.id
    );

    if (duplicate) {
      toast.error('Já existe uma empresa com este nome.');
      return;
    }

    const slugId = normalizeString(editingPartner.name || '').toLowerCase();
    const partnerToSave: Partner = {
      id: slugId,
      name: editingPartner.name || '',
      accessCode: editingPartner.accessCode || '',
      active: editingPartner.active ?? true,
      logoUrl: editingPartner.logoUrl || '',
      createdAt: editingPartner.createdAt || new Date().toISOString(),
      responsibleName: editingPartner.responsibleName || '',
      responsibleEmail: editingPartner.responsibleEmail || '',
      responsiblePhone: editingPartner.responsiblePhone || ''
    };

    // Cascade update: Se o nome mudou ou o ID de slug mudou (por exemplo, migração para slug ou renomeação)
    if (editingPartner.id && editingPartner.id !== slugId) {
       const existingPartner = allPartners.find(p => p.id === editingPartner.id);
       if (existingPartner) {
          const impactedCampaigns = db.campaigns.all().filter(c => c.partner === existingPartner.name);
          impactedCampaigns.forEach(c => {
             db.campaigns.save({ ...c, partner: partnerToSave.name });
          });
          if (impactedCampaigns.length > 0) {
            toast.success(`${impactedCampaigns.length} campanhas vinculadas foram atualizadas.`);
          }
          // Deleta o registro com o ID anterior para evitar duplicados / órfãos
          db.partners.delete(editingPartner.id);
       }
    }

    db.partners.save(partnerToSave);
    toast.success('Empresa salva!');
    loadData();
    setEditingPartner(null);
  };
  
  const saveWhitelistEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWhitelist || !editingWhitelist.name || !editingWhitelist.birthDate) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }

    const normalizedName = normalizeString(editingWhitelist.name);
    const normalizedDate = normalizeDate(editingWhitelist.birthDate);
    const normalizedId = `${normalizedName}_${normalizedDate}`;

    const entryToSave: WhitelistEntry = {
      code: normalizedId,
      name: editingWhitelist.name,
      birthDate: editingWhitelist.birthDate,
      phone: editingWhitelist.phone || '',
      campaignId: 'global' // Admin adds global entries by default in this view
    };

    db.whitelist.save(entryToSave);
    toast.success('Colaborador salvo!');
    loadData();
    setEditingWhitelist(null);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'partner' | 'contractor' | 'unit' = 'unit') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const b64 = evt.target?.result as string;
      if (target === 'partner') setEditingCampaign(prev => ({ ...prev, partner_logo_url: b64 }));
      else if (target === 'contractor') setEditingCampaign(prev => ({ ...prev, contractor_logo_url: b64 }));
      else setEditingUnit(prev => ({ ...prev, logoUrl: b64 }));
      toast.success("Logotipo carregado!");
    };
    reader.readAsDataURL(file);
  };

  const NavContent = () => (
    <>
      <div className="font-black text-2xl text-indigo-400 flex items-center gap-2 mb-8 px-2">
        <Database size={24} /> VoucherHub
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-2">Gerenciamento</p>
        <button onClick={() => { setActiveTab('audit'); setIsMobileMenuOpen(false); }} className={`w-full text-left p-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'audit' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><Clock size={16}/> Auditoria</button>
        <button onClick={() => { setActiveTab('campaigns'); setIsMobileMenuOpen(false); }} className={`w-full text-left p-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'campaigns' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><Ticket size={16}/> Campanhas</button>
        <button onClick={() => { setActiveTab('partners'); setIsMobileMenuOpen(false); }} className={`w-full text-left p-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'partners' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><Briefcase size={16}/> Empresas Parceiras</button>
        <button onClick={() => { setActiveTab('units'); setIsMobileMenuOpen(false); }} className={`w-full text-left p-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'units' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><Store size={16}/> Unidades</button>
        <button onClick={() => { setActiveTab('team'); setIsMobileMenuOpen(false); }} className={`w-full text-left p-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'team' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><ShieldCheck size={16}/> Equipe Admin</button>
        <Link to="/manual" className="w-full text-left p-3 rounded-xl font-bold text-sm text-slate-400 hover:text-white transition-all flex items-center gap-2">
          <Info size={16}/> Central de Ajuda (Manual)
        </Link>
        <Link to="/guia-parceiro" className="w-full text-left p-3 rounded-xl font-black text-sm text-indigo-100 bg-indigo-600/20 hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-2 border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
          <ExternalLink size={16}/> Guia Passo a Passo PDV
        </Link>
      </div>
      <div className="mt-auto space-y-4">
        <Link to="/" className="w-full text-left p-3 rounded-xl font-bold text-sm text-slate-400 hover:text-white transition-all flex items-center gap-2">
          <Home size={16}/> Sair para Home
        </Link>
        <button onClick={handleLogout} className="w-full text-left p-3 rounded-xl font-bold text-sm text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-2">
          <LogOut size={16}/> Sair do Admin
        </button>
        <button onClick={() => { db.clearAll(); loadData(); }} className="w-full text-left p-2 text-slate-500 hover:text-red-400 font-bold text-xs transition-colors flex items-center gap-2">
          <Trash2 size={14}/> Resetar Sistema
        </button>
      </div>
    </>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 font-sans">
      
      {/* MOBILE HEADER */}
      <header className="md:hidden bg-slate-900 p-4 flex justify-between items-center sticky top-0 z-40 text-white shadow-lg">
        <div className="font-black text-indigo-400 flex items-center gap-2">
          <Database size={20} /> VoucherHub
        </div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-white/10 rounded-lg">
          <Menu size={20} />
        </button>
      </header>

      {/* MOBILE DRAWER OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR (Desktop e Mobile Drawer) */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen w-64 bg-slate-900 border-r border-slate-800 p-8 flex flex-col gap-8 no-print text-white shrink-0 z-50 transition-transform duration-300
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden absolute top-4 right-4 text-slate-400">
          <X size={24} />
        </button>
        <NavContent />
        
        <div className="mt-auto pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            Cloud Sync Ativo
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center justify-center gap-2 transition-all mb-2"
          >
            <RefreshCw size={12} />
            Forçar Atualização
          </button>
          <button 
            onClick={() => {
              if(confirm('Isso limpará os dados temporários do navegador e recarregará tudo da nuvem. Continuar?')) {
                localStorage.clear();
                window.location.reload();
              }
            }} 
            className="w-full py-2 px-3 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-[10px] font-bold uppercase tracking-widest text-red-400 flex items-center justify-center gap-2 transition-all"
          >
            <Trash2 size={12} />
            Limpar Dados Locais
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-12 overflow-y-auto">
        {activeTab === 'audit' && (
          <AuditTab 
            vouchers={filteredVouchers} 
            whitelist={whitelist} 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
            onFileUpload={handleSpreadsheetUpload}
            onNewWhitelist={() => setEditingWhitelist({ name: '', birthDate: '', phone: '' })}
            onEditWhitelist={setEditingWhitelist}
            onDownloadTemplate={handleDownloadTemplate}
            importErrors={importErrors}
            onClearErrors={() => setImportErrors([])}
          />
        )}
        
        {activeTab === 'campaigns' && (
          <CampaignManager 
            campaigns={campaigns} 
            units={units} 
            onEdit={setEditingCampaign} 
            onNew={() => setEditingCampaign({ allowedUnits: [], active: true, benefit_type: 'fixed_amount', benefit_value: 0 })} 
            onDelete={(id: string) => { if(confirm('Excluir?')) { db.campaigns.delete(id); loadData(); } }}
          />
        )}
        
        {activeTab === 'units' && (
          <UnitManager 
            units={units} 
            onEdit={setEditingUnit} 
            onNew={() => setEditingUnit({ active: true, logoUrl: '' })} 
            onDelete={(id: string) => { if(confirm('Remover?')) { db.units.delete(id); loadData(); } }}
          />
        )}

        {activeTab === 'partners' && (
          <PartnerManager 
            partners={partners} 
            onEdit={setEditingPartner} 
            onNew={() => setEditingPartner({ active: true, accessCode: Math.random().toString(36).substr(2, 6).toUpperCase(), name: '' })} 
            onDelete={(id: string) => { if(confirm('Remover?')) { db.partners.delete(id); loadData(); } }}
          />
        )}

        {activeTab === 'team' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Equipe Admin</h2>
                <p className="text-slate-500 font-medium">Gerencie quem tem acesso total ao painel administrativo.</p>
              </div>
              <button 
                onClick={() => setShowAdminAdd(true)}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black shadow-lg hover:shadow-xl transition-all active:scale-95"
              >
                <Plus size={18}/> Novo Admin
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {admins.map(admin => (
                <div key={admin.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mb-4">
                      <ShieldCheck size={24}/>
                    </div>
                    <h3 className="font-black text-slate-900">{admin.email}</h3>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">UID: {admin.id}</p>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={async () => {
                        if(admin.email.toLowerCase() === 'gustavobarakat1303@gmail.com') return toast.error('O admin principal não pode ser removido.');
                        if(!confirm(`Remover acesso administrativo de ${admin.email}?`)) return;
                        if(!auth.currentUser) {
                          return toast.error('Você precisa estar logado via Google (não via bypass) para remover admins.', { duration: 7000 });
                        }
                        const loadingId = toast.loading('Removendo admin...');
                        try {
                          await db.admins.remove(admin.id);
                          toast.dismiss(loadingId);
                          toast.success('Admin removido.');
                          loadData();
                        } catch (err: any) {
                          toast.dismiss(loadingId);
                          toast.error(err?.message || 'Falha ao remover admin.', { duration: 7000 });
                          console.error('[ADMIN_REMOVE]', err);
                        }
                      }}
                      className="p-3 text-red-400 bg-red-50 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                    >
                      <Trash2 size={16}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {showAdminAdd && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden p-8">
                  <h3 className="text-xl font-black mb-2">Adicionar Administrador</h3>
                  <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">O novo admin precisa ter feito login pelo menos uma vez para você ter o UID dele.</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">E-mail Google</label>
                      <input 
                        value={newAdmin.email} 
                        onChange={e => setNewAdmin({...newAdmin, email: e.target.value})} 
                        className="w-full p-4 bg-slate-50 rounded-xl outline-none font-bold ring-1 ring-slate-100" 
                        placeholder="exemplo@gmail.com"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">User ID (UID - Cloud)</label>
                      <input 
                        value={newAdmin.uid} 
                        onChange={e => setNewAdmin({...newAdmin, uid: e.target.value})} 
                        className="w-full p-4 bg-slate-50 rounded-xl outline-none font-mono text-xs ring-1 ring-slate-100" 
                        placeholder="UID do Firebase"
                      />
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button onClick={() => setShowAdminAdd(false)} className="flex-1 py-4 bg-slate-100 rounded-xl font-black text-slate-400 uppercase tracking-widest text-[11px]">Cancelar</button>
                      <button
                        onClick={async () => {
                          const email = newAdmin.email.trim();
                          const uid = newAdmin.uid.trim();
                          if(!email || !uid) return toast.error('Preencha todos os campos.');
                          if(!auth.currentUser) {
                            return toast.error('Você precisa estar logado via Google (não via bypass) para cadastrar admins, pois a escrita no Firestore exige autenticação real.', { duration: 7000 });
                          }
                          const loadingId = toast.loading('Salvando admin...');
                          try {
                            await db.admins.save(email, uid);
                            toast.dismiss(loadingId);
                            toast.success('Admin adicionado!');
                            setShowAdminAdd(false);
                            setNewAdmin({ email: '', uid: '' });
                            loadData();
                          } catch (err: any) {
                            toast.dismiss(loadingId);
                            toast.error(err?.message || 'Falha ao salvar admin.', { duration: 7000 });
                            console.error('[ADMIN_SAVE]', err);
                          }
                        }}
                        className="flex-1 py-4 bg-amber-500 text-white rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-amber-200"
                      >
                        Autorizar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Unidade */}
        {editingUnit && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-6 bg-emerald-600 text-white flex justify-between items-center">
                <h3 className="text-xl font-black">{editingUnit.id ? 'Configurar Unidade' : 'Novo PDV'}</h3>
                <button onClick={() => setEditingUnit(null)} className="p-2 hover:bg-black/10 rounded-full transition-colors"><X size={20}/></button>
              </div>
              <form onSubmit={saveUnit} className="p-8 space-y-6">
                <div className="flex flex-col items-center">
                  <div className="relative group">
                    <div className="w-24 h-24 bg-slate-100 rounded-[1.5rem] border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden transition-all">
                      {editingUnit.logoUrl ? (
                        <img src={editingUnit.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={32} className="text-slate-300" />
                      )}
                    </div>
                    <label className="absolute inset-0 cursor-pointer opacity-0 z-10">
                      <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, 'unit')} className="hidden" />
                    </label>
                  </div>
                </div>
                <div className="space-y-4">
                  <input required value={editingUnit.name || ''} onChange={e => setEditingUnit({...editingUnit, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 outline-none font-bold" placeholder="Nome Unidade" />
                  <div className="grid grid-cols-2 gap-4">
                    <input required value={editingUnit.city || ''} onChange={e => setEditingUnit({...editingUnit, city: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 outline-none font-bold text-sm" placeholder="Cidade" />
                    <input required value={editingUnit.accessCode || ''} onChange={e => setEditingUnit({...editingUnit, accessCode: e.target.value.toUpperCase()})} className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 outline-none font-mono font-bold text-sm" placeholder="SENHA ACESSO" />
                  </div>
                  <div className="space-y-4">
                    <input value={editingUnit.menuUrl || ''} onChange={e => setEditingUnit({...editingUnit, menuUrl: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 outline-none font-bold text-sm" placeholder="Link do Cardápio (URL)" />
                    <input value={editingUnit.reservationUrl || ''} onChange={e => setEditingUnit({...editingUnit, reservationUrl: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 outline-none font-bold text-sm" placeholder="Link de Reservas (URL)" />
                  </div>
                </div>
                <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black shadow-xl hover:bg-emerald-700">Salvar Unidade</button>
              </form>
            </div>
          </div>
        )}

        {/* Modal Parceiro */}
        {editingPartner && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
                <h3 className="text-xl font-black">{editingPartner.id ? 'Configurar Empresa' : 'Nova Empresa Parceira'}</h3>
                <button onClick={() => setEditingPartner(null)} className="p-2 hover:bg-black/10 rounded-full transition-colors"><X size={20}/></button>
              </div>
              <form onSubmit={savePartner} className="p-8 space-y-5">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nome da Empresa</label>
                  <input value={editingPartner.name || ''} onChange={e => setEditingPartner({ ...editingPartner, name: e.target.value })} className="w-full p-4 bg-slate-50 rounded-xl outline-none font-bold ring-1 ring-slate-100 placeholder:text-slate-300" placeholder="Ex: FIAT, Google, XP" required />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nome do Responsável</label>
                    <input value={editingPartner.responsibleName || ''} onChange={e => setEditingPartner({ ...editingPartner, responsibleName: e.target.value })} className="w-full p-4 bg-slate-50 rounded-xl outline-none font-bold ring-1 ring-slate-100" placeholder="Nome completo" required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Email Corporativo</label>
                    <input type="email" value={editingPartner.responsibleEmail || ''} onChange={e => setEditingPartner({ ...editingPartner, responsibleEmail: e.target.value })} className="w-full p-4 bg-slate-50 rounded-xl outline-none font-bold ring-1 ring-slate-100" placeholder="email@empresa.com" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Contato Comercial</label>
                    <input value={editingPartner.responsiblePhone || ''} onChange={e => setEditingPartner({ ...editingPartner, responsiblePhone: maskPhone(e.target.value) })} className="w-full p-4 bg-slate-50 rounded-xl outline-none font-bold ring-1 ring-slate-100" placeholder="(00) 00000-0000" required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Código de Acesso</label>
                    <input value={editingPartner.accessCode || ''} onChange={e => setEditingPartner({ ...editingPartner, accessCode: e.target.value.toUpperCase() })} className="w-full p-4 bg-slate-50 rounded-xl outline-none font-mono font-bold ring-1 ring-slate-100" placeholder="SENHA123" required />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Status do Acesso</label>
                  <button type="button" onClick={() => setEditingPartner({ ...editingPartner, active: !editingPartner.active })} className={`w-full p-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${editingPartner.active ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    {editingPartner.active ? 'Autorizado' : 'Bloqueado'}
                  </button>
                </div>

                <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all">
                  {editingPartner.id ? 'Atualizar Empresa' : 'Cadastrar Empresa'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal Whitelist Individual */}
        {editingWhitelist && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
                <h3 className="text-xl font-black">Cadastro Individual</h3>
                <button onClick={() => setEditingWhitelist(null)} className="p-2 hover:bg-black/10 rounded-full transition-colors"><X size={20}/></button>
              </div>
              <form onSubmit={saveWhitelistEntry} className="p-8 space-y-5">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nome Completo</label>
                  <input required value={editingWhitelist.name || ''} onChange={e => setEditingWhitelist({ ...editingWhitelist, name: e.target.value })} className="w-full p-4 bg-slate-50 rounded-xl outline-none font-bold ring-1 ring-slate-100" placeholder="Nome do colaborador" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Data de Nascimento</label>
                    <input required value={editingWhitelist.birthDate || ''} onChange={e => setEditingWhitelist({ ...editingWhitelist, birthDate: maskDate(e.target.value) })} className="w-full p-4 bg-slate-50 rounded-xl outline-none font-bold ring-1 ring-slate-100" placeholder="DD/MM/AAAA" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Telefone (Opcional)</label>
                    <input value={editingWhitelist.phone || ''} onChange={e => setEditingWhitelist({ ...editingWhitelist, phone: maskPhone(e.target.value) })} className="w-full p-4 bg-slate-50 rounded-xl outline-none font-bold ring-1 ring-slate-100" placeholder="(00) 00000-0000" />
                  </div>
                </div>
                <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all">
                  Salvar Colaborador
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal Campanha */}
        {editingCampaign && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 my-auto">
              <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
                <h3 className="text-xl font-black">{editingCampaign.id ? 'Editar Campanha' : 'Nova Campanha'}</h3>
                <button onClick={() => setEditingCampaign(null)} className="p-2 hover:bg-white/10 rounded-full"><X size={20}/></button>
              </div>
              <form onSubmit={saveCampaign} className="p-6 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
                
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                  <div className="flex flex-col items-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Logo do Parceiro</p>
                    <div className="relative group">
                      <div className="w-20 h-20 bg-white rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-indigo-400 group-hover:bg-indigo-50/30">
                        {editingCampaign.partner_logo_url ? (
                          <img src={editingCampaign.partner_logo_url} alt="Logo Parceiro" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon size={24} className="text-slate-300 group-hover:text-indigo-400" />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera className="text-white" size={20} />
                        </div>
                      </div>
                      <label className="absolute inset-0 cursor-pointer opacity-0 z-10">
                        <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, 'partner')} className="hidden" />
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Logo do Contratante</p>
                    <div className="relative group">
                      <div className="w-20 h-20 bg-white rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-indigo-400 group-hover:bg-indigo-50/30">
                        {editingCampaign.contractor_logo_url ? (
                          <img src={editingCampaign.contractor_logo_url} alt="Logo Contratante" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon size={24} className="text-slate-300 group-hover:text-indigo-400" />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera className="text-white" size={20} />
                        </div>
                      </div>
                      <label className="absolute inset-0 cursor-pointer opacity-0 z-10">
                        <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, 'contractor')} className="hidden" />
                      </label>
                    </div>
                  </div>
                  <p className="col-span-2 text-[9px] text-slate-400 mt-1 font-medium text-center">Recomendado: PNG ou JPG quadrado</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Nome da Campanha</p>
                    <input required value={editingCampaign.name || ''} onChange={e => setEditingCampaign({...editingCampaign, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-200 outline-none font-bold focus:ring-2 focus:ring-indigo-500" placeholder="Ex: Assinante Premium" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Empresa Contratante (Pagadora)</p>
                    <input required value={editingCampaign.contractor || ''} onChange={e => setEditingCampaign({...editingCampaign, contractor: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-200 outline-none font-bold focus:ring-2 focus:ring-indigo-500" placeholder="Ex: UOL, SAP, iFood" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Título do Parceiro (Exibição)</p>
                  <input required value={editingCampaign.partner || ''} onChange={e => setEditingCampaign({...editingCampaign, partner: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-200 outline-none font-bold focus:ring-2 focus:ring-indigo-500" placeholder="Ex: Restaurantes Parceiros" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Tipo de Benefício</p>
                    <select value={editingCampaign.benefit_type || 'fixed_amount'} onChange={e => setEditingCampaign({...editingCampaign, benefit_type: e.target.value as BenefitType})} className="w-full p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-200 font-bold outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="fixed_amount">Desconto Valor Fixo (R$)</option>
                      <option value="percent">Desconto Percentual (%)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Valor do Benefício</p>
                    <input required type="number" step="0.01" value={editingCampaign.benefit_value || ''} onChange={e => setEditingCampaign({...editingCampaign, benefit_value: Number(e.target.value)})} className="w-full p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-200 outline-none font-bold focus:ring-2 focus:ring-indigo-500" placeholder="0.00" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Limite Mensal (Emissão)</p>
                    <input required type="number" value={editingCampaign.monthlyLimit || ''} onChange={e => setEditingCampaign({...editingCampaign, monthlyLimit: Number(e.target.value)})} className="w-full p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-200 outline-none font-bold focus:ring-2 focus:ring-indigo-500" placeholder="Ex: 100" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Limite Mensal (Uso/Validação)</p>
                    <input required type="number" value={editingCampaign.monthlyUsageLimit || ''} onChange={e => setEditingCampaign({...editingCampaign, monthlyUsageLimit: Number(e.target.value)})} className="w-full p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-200 outline-none font-bold focus:ring-2 focus:ring-indigo-500" placeholder="Ex: 100" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Limite por Código/Mês</p>
                  <input required type="number" value={editingCampaign.limitPerCodePerMonth || ''} onChange={e => setEditingCampaign({...editingCampaign, limitPerCodePerMonth: Number(e.target.value)})} className="w-full p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-200 outline-none font-bold focus:ring-2 focus:ring-indigo-500" placeholder="Ex: 1" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Validade da Campanha (Data Limite)</p>
                    <input type="datetime-local" value={editingCampaign.hardStopDate ? editingCampaign.hardStopDate.slice(0, 16) : '2027-12-31T23:59'} onChange={e => setEditingCampaign({...editingCampaign, hardStopDate: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-200 outline-none font-bold focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Validade do Voucher (Dias)</p>
                    <input type="number" value={editingCampaign.voucherValidityDays || ''} onChange={e => setEditingCampaign({...editingCampaign, voucherValidityDays: Number(e.target.value)})} className="w-full p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-200 outline-none font-bold focus:ring-2 focus:ring-indigo-500" placeholder="Ex: 30" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Regras e Instruções (Opcional)</p>
                  <textarea value={editingCampaign.rules_text || ''} onChange={e => setEditingCampaign({...editingCampaign, rules_text: e.target.value})} rows={3} className="w-full p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-200 outline-none resize-none text-sm focus:ring-2 focus:ring-indigo-500" placeholder="Regras de uso que aparecerão para o cliente..." />
                </div>
                
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Lojas Autorizadas</p>
                  <div className="flex flex-wrap gap-2">
                    {units.map(u => (
                      <button key={u.id} type="button" onClick={() => {
                        const current = editingCampaign.allowedUnits || [];
                        const next = current.includes(u.id) ? current.filter(id => id !== u.id) : [...current, u.id];
                        setEditingCampaign({...editingCampaign, allowedUnits: next});
                      }} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${editingCampaign.allowedUnits?.includes(u.id) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-300'}`}>
                        {u.name}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all active:scale-95">Salvar Configurações</button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const AuditTab = ({ 
  vouchers, 
  whitelist, 
  searchTerm, 
  setSearchTerm, 
  onFileUpload, 
  onNewWhitelist, 
  onEditWhitelist,
  onDownloadTemplate,
  importErrors,
  onClearErrors
}: any) => {
  const appBaseUrl = window.location.href.split('#')[0];
  const [visibleWhitelist, setVisibleWhitelist] = useState(50);
  const [visibleVouchers, setVisibleVouchers] = useState(50);

  const links = [
    { name: 'Vitrine (Cliente)', url: `${appBaseUrl}#/cliente`, icon: <LayoutGrid size={16}/>, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { name: 'PDV (Operação)', url: `${appBaseUrl}#/operacao`, icon: <Store size={16}/>, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Painel Contratante', url: `${appBaseUrl}#/contratante`, icon: <Building2 size={16}/>, color: 'text-sky-600', bg: 'bg-sky-50' },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Link copiado!");
  };

  const exportWhitelist = () => {
    if (whitelist.length === 0) return toast.error("Nenhum dado para exportar");
    const data = whitelist.map((w: any) => ({
      Nome: w.name,
      Nascimento: w.birthDate,
      Telefone: w.phone || '',
      CampanhaID: w.campaignId || 'global',
      Codigo_ID: w.code
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `whitelist_global_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success("Whitelist exportada!");
  };

  const exportVouchers = () => {
    if (vouchers.length === 0) return toast.error("Nenhum dado para exportar");
    const data = vouchers.map((v: any) => ({
      Data_Emissao: v.createdAt ? new Date(v.createdAt).toLocaleString('pt-BR') : '',
      Colaborador: v.name,
      Doc_Identificacao: v.customerCode,
      Codigo_Voucher: v.code,
      Status: v.status === 'used' ? 'VALIDADO' : 'PENDENTE',
      Campanha: v.campaignName || '',
      Parceiro: v.partner || '',
      Unidade_Validacao: v.usedUnitName || v.usedUnitId || '',
      Data_Validacao: v.usedAt ? new Date(v.usedAt).toLocaleString('pt-BR') : ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio_vouchers_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success("Relatório de vouchers exportado!");
  };

  const reversedWhitelist = whitelist.slice().reverse();

  return (
  <div className="animate-in fade-in duration-500">
    <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Monitoramento</h1>
      <div className="flex flex-wrap gap-2">
        {links.map(link => (
          <div key={link.name} className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1.5 pr-3 shadow-sm">
            <div className={`w-8 h-8 ${link.bg} ${link.color} rounded-lg flex items-center justify-center`}>
              {link.icon}
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{link.name}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => copyToClipboard(link.url)} className="text-slate-400 hover:text-indigo-600 transition-colors"><Copy size={10}/></button>
                <a href={link.url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-indigo-600 transition-colors"><ExternalLink size={10}/></a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </header>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-12">
      <StatCard label="Colaboradores" value={whitelist.length} icon={<Users />} color="indigo" />
      <StatCard label="Emitidos" value={vouchers.length} icon={<Ticket />} color="emerald" />
      <StatCard label="Resgates" value={vouchers.filter((v:any) => v.status === VoucherStatus.USED).length} icon={<Clock />} color="amber" />
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
      <div className="xl:col-span-2 space-y-8">
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black flex items-center gap-2 text-slate-900"><FileSpreadsheet className="text-indigo-600" size={20}/> Whitelist Global</h3>
            <div className="flex gap-2">
              <button 
                onClick={onDownloadTemplate}
                title="Baixar Template"
                className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
              >
                <FileSpreadsheet size={16}/>
              </button>
              <button 
                onClick={exportWhitelist}
                title="Exportar CSV"
                className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-all"
              >
                <Download size={16}/>
              </button>
              <button onClick={onNewWhitelist} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"><Plus size={16}/></button>
            </div>
          </div>
          {importErrors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center gap-2">
                  <Info size={12} /> Erros na última importação:
                </p>
                <button onClick={onClearErrors} className="text-red-400 hover:text-red-600"><X size={12}/></button>
              </div>
              <div className="max-h-24 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {importErrors.map((err, i) => (
                  <p key={i} className="text-[9px] text-red-500 font-medium">Linha {err.line}: {err.error}</p>
                ))}
              </div>
            </div>
          )}
          <p className="text-[10px] text-slate-500 mb-4 font-bold uppercase tracking-tight">Importe colaboradores de forma global. Para campanhas vinculadas, importe no Painel da Empresa.</p>
          <label className="group flex flex-col items-center justify-center w-full h-40 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 cursor-pointer hover:border-indigo-400 transition-all text-center p-4 mb-8">
            <UploadCloud className="w-8 h-8 text-slate-300 group-hover:text-indigo-500 mb-2" />
            <p className="text-[10px] font-black text-slate-500 mb-1">Upload Planilha (XLSX)</p>
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={onFileUpload} />
          </label>

          <h3 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-widest">Base de Colaboradores</h3>
          <div className="space-y-2 overflow-y-auto max-h-[400px] custom-scrollbar pr-1 pb-4">
             {whitelist.length > 0 ? (
               <>
                {reversedWhitelist.slice(0, visibleWhitelist).map((w: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center whitespace-nowrap overflow-hidden group">
                      <div className="truncate">
                        <p className="font-bold text-slate-800 text-[11px] truncate">{w.name}</p>
                        <p className="text-[9px] text-slate-500 truncate">{w.birthDate} • {w.phone || 'Sem tel'}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => onEditWhitelist(w)}
                          className="p-2 text-slate-300 hover:text-indigo-500 transition-colors"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button 
                          onClick={() => { if(confirm('Remover da base?')) { db.whitelist.delete(w.code); } }}
                          className="p-2 text-red-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                  </div>
                ))}
                {reversedWhitelist.length > visibleWhitelist && (
                  <button 
                    onClick={() => setVisibleWhitelist(prev => prev + 50)}
                    className="w-full py-3 mt-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Carregar Mais (+50)
                  </button>
                )}
               </>
             ) : <p className="text-center text-slate-400 py-10 text-[10px] uppercase font-black">Nenhum dado importado</p>}
          </div>
        </div>

        {/* Lista de Aniversariantes */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200">
           <h3 className="text-lg font-black mb-4 flex items-center gap-2 text-slate-900">
             <Clock className="text-indigo-600" size={20}/> Aniversariantes do Mês
           </h3>
           <div className="space-y-3">
             {(() => {
               const currentMonth = new Date().getMonth() + 1;
               const bornThisMonth = whitelist.filter((w: any) => {
                 if (!w.birthDate) return false;
                 // Tenta extrair o mês de formatos comuns como DD/MM/AAAA ou YYYY-MM-DD
                 const parts = w.birthDate.split(/[\/\-]/);
                 if (parts.length < 2) return false;
                 
                 let month = 0;
                 if (parts[0].length === 4) {
                   // YYYY-MM-DD
                   month = parseInt(parts[1]);
                 } else {
                   // DD/MM/YYYY
                   month = parseInt(parts[1]);
                 }
                 
                 return month === currentMonth;
               });

               return bornThisMonth.length > 0 ? bornThisMonth.map((w: any, idx: number) => (
                 <div key={idx} className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 flex flex-col">
                   <p className="font-black text-indigo-900 text-[11px]">{w.name}</p>
                   <div className="flex justify-between items-center mt-1">
                     <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">{w.birthDate}</p>
                     <p className="text-[10px] font-black text-indigo-600">{w.phone || 'S/ Tel'}</p>
                   </div>
                 </div>
               )) : <p className="text-center text-slate-400 py-8 text-[10px] uppercase font-black">Nenhum aniversariante este mês</p>;
             })()}
           </div>
        </div>
      </div>
      <div className="xl:col-span-3 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h3 className="text-lg font-black text-slate-900">Histórico de Resgates</h3>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <input type="text" placeholder="Filtrar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="px-4 py-2 bg-slate-100 rounded-full text-xs font-bold outline-none w-full md:w-56" />
            <button 
              onClick={exportVouchers}
              title="Exportar CSV"
              className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95"
            >
              <Download size={18}/>
            </button>
          </div>
        </div>
        <div className="space-y-2 overflow-y-auto max-h-[600px] custom-scrollbar pr-1 pb-4">
          {vouchers.slice(0, visibleVouchers).map((v:any) => (
            <div key={v.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
              <div className="truncate pr-4">
                <p className="font-black text-slate-900 truncate">{v.name}</p>
                <p className="text-[9px] text-slate-400 font-bold">{v.customerCode} • {v.code}</p>
              </div>
              <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase shrink-0 ${v.status === VoucherStatus.USED ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                {v.status === VoucherStatus.USED ? 'OK' : 'PEND'}
              </span>
            </div>
          ))}
          {vouchers.length > visibleVouchers && (
            <button 
              onClick={() => setVisibleVouchers(prev => prev + 50)}
              className="w-full py-4 mt-2 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-slate-200"
            >
              Carregar Mais (+50)
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
  );
};

const CampaignManager = ({ campaigns, onEdit, onNew, onDelete }: any) => (
  <div className="animate-in fade-in duration-500">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
      <div><h1 className="text-2xl md:text-3xl font-black text-slate-900">Campanhas</h1><p className="text-slate-500 text-sm">Gestão de benefícios.</p></div>
      <button onClick={onNew} className="w-full md:w-auto bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black flex items-center justify-center gap-2"><Plus size={18}/> Nova</button>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
      {campaigns.map((c:any) => (
        <div key={c.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden border">
                {c.partner_logo_url ? <img src={c.partner_logo_url} className="w-full h-full object-cover" /> : <Ticket size={20} className="text-slate-300" />}
              </div>
              <h3 className="text-sm font-black text-slate-900">{c.partner}</h3>
            </div>
            <button className={`p-1.5 rounded-lg ${c.active ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-300'}`}><Power size={16}/></button>
          </div>
          <p className="text-lg font-black text-slate-900 mb-1">{c.benefit_type === 'percent' ? `${c.benefit_value}%` : `R$ ${c.benefit_value?.toFixed(2)}`}</p>
          <div className="space-y-1 mb-6">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
              <Clock size={10}/> Data Limite: {new Date(c.hardStopDate).toLocaleDateString('pt-BR')}
            </p>
            {c.voucherValidityDays ? (
              <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest flex items-center gap-1">
                <Ticket size={10}/> Validade Voucher: {c.voucherValidityDays} dias
              </p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <button onClick={() => onEdit(c)} className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest">Configurar</button>
            <button onClick={() => onDelete(c.id)} className="p-2.5 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16}/></button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const UnitManager = ({ units, onEdit, onNew, onDelete }: any) => (
  <div className="animate-in fade-in duration-500">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
      <div><h1 className="text-2xl md:text-3xl font-black text-slate-900">Unidades</h1><p className="text-slate-500 text-sm">Pontos de venda.</p></div>
      <button onClick={onNew} className="w-full md:w-auto bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black flex items-center justify-center gap-2"><Plus size={18}/> Nova</button>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {units.map((u:any) => (
        <div key={u.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden mb-4 border">
             {u.logoUrl ? <img src={u.logoUrl} className="w-full h-full object-cover" /> : <Store size={20} className="text-slate-300" />}
          </div>
          <h3 className="font-black text-slate-900 mb-1">{u.name}</h3>
          <p className="text-[10px] text-slate-500 flex items-center gap-1 mb-4 font-bold uppercase"><MapPin size={10}/> {u.city}</p>
          <div className="mb-4 space-y-2">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Senha de Acesso PDV:</p>
              <code className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">{u.accessCode}</code>
            </div>
            {u.menuUrl && (
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                <Utensils size={10} className="text-emerald-500" />
                <span className="truncate">Cardápio configurado</span>
              </div>
            )}
            {u.reservationUrl && (
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                <CalendarDays size={10} className="text-indigo-500" />
                <span className="truncate">Reservas configuradas</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => onEdit(u)} className="flex-1 py-2.5 bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest">Configurar</button>
            <button 
              onClick={() => {
                const link = `${window.location.origin}${window.location.pathname}#/guia-parceiro`;
                navigator.clipboard.writeText(link);
                toast.success('Link do Guia Operacional copiado!');
              }}
              className="p-2.5 text-indigo-400 bg-indigo-50 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
              title="Copiar Guia Operacional para enviar ao Parceiro"
            >
              <HelpCircle size={16}/>
            </button>
            <button onClick={() => onDelete(u.id)} className="p-2.5 text-red-400 bg-red-50 rounded-xl"><Trash2 size={16}/></button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const PartnerManager = ({ partners, onEdit, onNew, onDelete }: any) => (
  <div className="animate-in fade-in duration-500">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
      <div><h1 className="text-2xl md:text-3xl font-black text-slate-900">Empresas Parceiras</h1><p className="text-slate-500 text-sm">Empresas que contratam os benefícios.</p></div>
      <button onClick={onNew} className="w-full md:w-auto bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black flex items-center justify-center gap-2"><Plus size={18}/> Nova Empresa</button>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {partners.map((p:any) => (
        <div key={p.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className={`absolute top-0 right-0 w-2 h-full ${p.active ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
          <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden mb-4 border">
             {p.logoUrl ? <img src={p.logoUrl} className="w-full h-full object-cover" /> : <Building2 size={20} className="text-slate-300" />}
          </div>
          <h3 className="font-black text-slate-900 mb-1">{p.name}</h3>
          <div className="mb-4 space-y-1">
            <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
              <Users size={10} className="text-slate-300"/> {p.responsibleName || 'Sem responsável'}
            </p>
            <p className="text-[10px] text-slate-400 font-medium truncate italic">{p.responsibleEmail}</p>
          </div>
          <div className="mb-4">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Cód. Acesso (Login):</p>
            <code className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{p.accessCode}</code>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onEdit(p)} className="flex-1 py-2.5 bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">Editar</button>
            <button onClick={() => onDelete(p.id)} className="p-2.5 text-red-400 bg-red-50 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16}/></button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const StatCard = ({ label, value, icon, color }: any) => {
  const colors: any = { indigo: 'text-indigo-600 bg-indigo-50', emerald: 'text-emerald-600 bg-emerald-50', amber: 'text-amber-600 bg-amber-50' };
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>{React.cloneElement(icon, { size: 24 })}</div>
      <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p><p className="text-xl font-black text-slate-900">{value}</p></div>
    </div>
  );
};

// Acesso Administrativo
const AdminLogin: React.FC<{ onLogin: (user: any) => void }> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const [showBypass, setShowBypass] = useState(false);
  const [emailInput, setEmailInput] = useState('gustavobarakat1303@gmail.com');
  const [passcode, setPasscode] = useState('');

  const handle = async () => { 
    setLoading(true);
    setErrorInfo(null);
    try {
      const userCredential = await loginAdmin();
      if (userCredential && userCredential.user) {
        onLogin(userCredential.user);
      }
    } catch (e: any) {
      console.error("[LOGIN ERROR]", e);
      let message = 'Falha na autenticação Google.';
      
      if (e.code === 'auth/unauthorized-domain') {
        message = `Domínio não autorizado: ${window.location.hostname}`;
        setErrorInfo(`O domínio ${window.location.hostname} precisa ser adicionado na lista de "Authorized Domains" no Console do Firebase (Authentication > Settings).`);
      } else if (e.code === 'auth/popup-closed-by-user') {
        message = 'Login cancelado pelo usuário.';
      } else {
        setErrorInfo(e.message || 'Erro desconhecido');
      }
      
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBypassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === 'UOL123' || passcode === 'VH2026' || passcode === 'ADMIN123') {
      const simulatedUser = {
        uid: 'contingency-admin-uid',
        email: emailInput.trim(),
        displayName: 'Administrador (Bypass)',
        photoURL: ''
      };
      onLogin(simulatedUser);
      toast.success('Acesso autorizado via Chave de Segurança!');
    } else {
      toast.error('Chave de segurança inválida.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6 relative">
      <Link to="/" className="absolute top-8 left-8 text-slate-400 hover:text-white transition-colors">
        <ChevronLeft size={24} />
      </Link>
      <div className="w-full max-w-sm bg-white p-10 rounded-[2.5rem] shadow-2xl text-center">
        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6"><ShieldCheck className="text-white" size={28}/></div>
        <h2 className="text-xl font-black mb-2 text-slate-900">Acesso Restrito</h2>
        <p className="text-slate-500 text-sm mb-8">Utilize seu e-mail administrativo para acessar o painel.</p>
        
        {!showBypass ? (
          <>
            <button 
              onClick={handle} 
              disabled={loading}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-lg mb-4 flex items-center justify-center gap-3 hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              {loading ? <RefreshCw className="animate-spin" size={20} /> : <LogIn size={20} />}
              Entrar com Google
            </button>

            <button 
              onClick={() => setShowBypass(true)}
              className="w-full mt-2 py-3 bg-slate-100 hover:bg-slate-200 text-indigo-600 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
            >
              Chave de Segurança / Bypass
            </button>
          </>
        ) : (
          <form onSubmit={handleBypassSubmit} className="space-y-4 text-left mb-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">E-mail Administrativo</label>
              <input 
                type="email"
                placeholder="exemplo@gmail.com"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 outline-none font-bold focus:ring-2 focus:ring-indigo-500 transition-all text-sm text-slate-800"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Passcode / Chave Admin</label>
              <input 
                type="password"
                placeholder="Ex prime: ADMIN123"
                value={passcode}
                onChange={e => setPasscode(e.target.value)}
                className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 outline-none font-bold focus:ring-2 focus:ring-indigo-500 transition-all text-sm text-slate-800"
                required
              />
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg transition-all"
            >
              Acessar Painel
            </button>

            <button 
              type="button" 
              onClick={() => setShowBypass(false)}
              className="w-full py-2 text-center text-slate-400 hover:text-slate-600 transition-all font-bold text-xs"
            >
              Voltar para Opção Google
            </button>
          </form>
        )}

        {errorInfo && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-left">
            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1 flex items-center gap-2">
              <Info size={12} /> Erro de Configuração
            </p>
            <p className="text-[10px] text-red-500 font-medium leading-relaxed">
              {errorInfo}
            </p>
          </div>
        )}
        
        <div className="pt-6 border-t border-slate-100 space-y-3">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-2">Opções de Suporte</p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full py-3 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw size={14} /> Atualizar Página
          </button>
          <button 
            onClick={() => {
              if(confirm('Isso limpará os dados temporários e recarregará tudo da nuvem. Continuar?')) {
                localStorage.clear();
                window.location.reload();
              }
            }} 
            className="w-full py-3 bg-red-50 text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all flex items-center justify-center gap-2"
          >
            <Trash2 size={14} /> Limpar Dados Locais
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminModule;