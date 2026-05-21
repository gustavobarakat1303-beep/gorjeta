
import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db, useDataSync, subscribe, normalizeString, normalizeDate, firestore, refreshPartnerStatus } from '../services/dataService';
import { clearPartnerSession, writePartnerSession } from '../modules/ContractorModule';
import { Campaign, Voucher, VoucherStatus, WhitelistEntry, User } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';
import { 
  Users, Ticket, Clock, FileSpreadsheet, UploadCloud, 
  TrendingUp, CheckCircle, AlertCircle, Search, Download,
  ExternalLink, Copy, Store, LayoutGrid, LogOut, HelpCircle, RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

interface ContractorDashboardProps {
  user: User;
}

const ContractorDashboard: React.FC<ContractorDashboardProps> = ({ user }) => {
  useDataSync();
  const [searchTerm, setSearchTerm] = useState('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');
  const [importErrors, setImportErrors] = useState<{line: number, error: string}[]>([]);

  const handleDownloadTemplate = () => {
    const data = [
      { 'Nome Completo': 'João da Silva', 'Data Nascimento': '15/10/1985', 'Celular': '(11) 98888-7777' },
      { 'Nome Completo': 'Maria Oliveira', 'Data Nascimento': '22/03/1990', 'Celular': '(11) 97777-6666' }
    ];
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, `template_importacao_${user.partner.toLowerCase()}.xlsx`);
    toast.success("Template baixado!");
  };

  const [loadingCloud, setLoadingCloud] = useState(false);

  // Session verification: ONLY logs the partner out when we have a
  // definitive signal that the account is revoked (`active === false`
  // explicitly returned by Firestore). Transient errors, race conditions,
  // and "doc not found" lookups never destroy a valid session — they would
  // be indistinguishable from a real outage and the previous behavior was
  // the root cause of partners being silently kicked back to the login
  // screen with "Sessão expirada".
  useEffect(() => {
    let cancelled = false;

    const cached = db.partners.getById(user.id);
    if (cached && cached.active === false) {
      toast.error('O acesso para esta empresa foi revogado pela administração.');
      handleLogout();
      return;
    }

    const verifyPartner = async () => {
      const result = await refreshPartnerStatus(user.id);
      if (cancelled) return;

      if (result.status === 'found') {
        db.partners.save(result.partner, false);
        // Keep the persisted session payload in sync with the latest server state.
        writePartnerSession(user, result.partner);
        if (result.partner.active === false) {
          toast.error('O acesso para esta empresa foi revogado ou desativado.');
          handleLogout();
        }
        return;
      }

      // Both `not_found` and `network_error` are treated as non-destructive:
      // we keep the active session and only log a warning. The partner
      // continues to use the cached data; a real revocation will be picked
      // up on the next successful poll or page reload.
      if (result.status === 'not_found') {
        console.warn('[SESSION_CHECK] Partner doc not found in Firestore; keeping session alive.');
      } else {
        console.warn('[SESSION_CHECK] Transient error while verifying partner; keeping session alive.', result.error);
      }
    };

    verifyPartner();

    // Periodic background re-check (every 5 minutes) — same non-destructive
    // semantics. This catches admin-side deactivations without ever kicking
    // a healthy session out on a network blip.
    const interval = window.setInterval(verifyPartner, 5 * 60 * 1000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [user.id]);

  const loadData = () => {
    // Only log out when we have an explicit `active === false` from the
    // cache. A missing/undefined `active` field is treated as "unknown",
    // never as "inactive" — same non-destructive policy as verifyPartner.
    const partnerData = db.partners.getById(user.id);
    if (partnerData && partnerData.active === false) {
      toast.error('O acesso para esta empresa foi desativado.');
      handleLogout();
      return;
    }

    // Busca tolerante a variações e campos contractor/partner
    const allCampaigns = db.campaigns.all().filter(c => {
      const normContractor = c.contractor ? normalizeString(c.contractor) : "";
      const normPartner = c.partner ? normalizeString(c.partner) : "";
      const normUserPartner = normalizeString(user.partner || "");
      return normContractor === normUserPartner || normPartner === normUserPartner;
    });

    const allVouchers = db.vouchers.all().filter(v => {
      const camp = db.campaigns.getById(v.campaignId);
      if (!camp) return false;
      const normContractor = camp.contractor ? normalizeString(camp.contractor) : "";
      const normPartner = camp.partner ? normalizeString(camp.partner) : "";
      const normUserPartner = normalizeString(user.partner || "");
      return normContractor === normUserPartner || normPartner === normUserPartner;
    });

    const myCampaignIds = new Set(allCampaigns.map(c => c.id));
    const allWhitelist = db.whitelist.all().filter(w => {
      return w.campaignId && myCampaignIds.has(w.campaignId);
    });

    setCampaigns(allCampaigns);
    setVouchers(allVouchers);
    setWhitelist(allWhitelist);
  };

  const fetchFromFirestore = async () => {
    setLoadingCloud(true);
    console.log("[CONTRACTOR_SYNC] Starting Firestore fetch for partner:", user.partner);
    try {
      const { collection, getDocs } = await import('firebase/firestore');

      // 1. Sincronizar as campanhas do Firestore
      const campaignsSnap = await getDocs(collection(firestore, 'campaigns'));
      const fetchedCampaigns: Campaign[] = [];
      campaignsSnap.forEach(d => {
        const data = d.data() as Campaign;
        const normContractor = data.contractor ? normalizeString(data.contractor) : "";
        const normPartner = data.partner ? normalizeString(data.partner) : "";
        const normUserPartner = normalizeString(user.partner || "");
        
        if (normContractor === normUserPartner || normPartner === normUserPartner) {
          fetchedCampaigns.push({ id: d.id, ...data });
        }
      });
      console.log("[CONTRACTOR_SYNC] Fetched campaigns from cloud:", fetchedCampaigns.length);

      // Salva no cache local para visibilidade instantânea
      fetchedCampaigns.forEach(c => {
        db.campaigns.save(c, false); // false para não regravar no firestore
      });

      const campaignIds = fetchedCampaigns.map(c => c.id);

      if (campaignIds.length > 0) {
        // 2. Sincronizar todos os whitelist das campanhas encontradas
        const whitelistSnap = await getDocs(collection(firestore, 'whitelist'));
        const fetchedWhitelist: WhitelistEntry[] = [];
        whitelistSnap.forEach(d => {
          const data = d.data() as WhitelistEntry;
          if (data.campaignId && campaignIds.includes(data.campaignId)) {
            fetchedWhitelist.push(data);
          }
        });
        console.log("[CONTRACTOR_SYNC] Fetched whitelist entries from cloud:", fetchedWhitelist.length);

        fetchedWhitelist.forEach(w => {
          db.whitelist.save(w, false);
        });

        // 3. Sincronizar todos os vouchers das campanhas encontradas
        const vouchersSnap = await getDocs(collection(firestore, 'vouchers'));
        const fetchedVouchers: Voucher[] = [];
        vouchersSnap.forEach(d => {
          const data = d.data() as Voucher;
          if (data.campaignId && campaignIds.includes(data.campaignId)) {
            fetchedVouchers.push({ id: d.id, ...data });
          }
        });
        console.log("[CONTRACTOR_SYNC] Fetched vouchers from cloud:", fetchedVouchers.length);

        // Atualiza a lista de vouchers locais
        const currentLocal = db.vouchers.all();
        fetchedVouchers.forEach(v => {
          const idx = currentLocal.findIndex(x => x.code === v.code);
          if (idx > -1) {
            currentLocal[idx] = v;
          } else {
            currentLocal.push(v);
          }
        });
        localStorage.setItem('vh_vouchers', JSON.stringify(currentLocal));
      }

      // Atualiza a UI
      loadData();
    } catch (e) {
      console.error("[CONTRACTOR_SYNC] Error during full cloud sync:", e);
    } finally {
      setLoadingCloud(false);
    }
  };

  useEffect(() => {
    const unsub = subscribe(() => loadData());
    return () => unsub();
  }, [user.partner]);

  useEffect(() => {
    fetchFromFirestore();
  }, [user.partner]);

  const filteredCampaigns = useMemo(() => {
    if (selectedCampaignId === 'all') return campaigns;
    return campaigns.filter(c => c.id === selectedCampaignId);
  }, [campaigns, selectedCampaignId]);

  const filteredVouchers = useMemo(() => {
    let filtered = vouchers;
    if (selectedCampaignId !== 'all') {
      filtered = filtered.filter(v => v.campaignId === selectedCampaignId);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(v => 
        v.name?.toLowerCase().includes(term) || 
        v.customerCode?.toUpperCase().includes(term.toUpperCase()) ||
        v.code?.toLowerCase().includes(term)
      );
    }
    return filtered;
  }, [vouchers, selectedCampaignId, searchTerm]);

  const stats = useMemo(() => {
    const totalIssued = filteredVouchers.length;
    const totalUsed = filteredVouchers.filter(v => v.status === VoucherStatus.USED).length;
    const totalPending = totalIssued - totalUsed;
    
    const chartData = [
      { name: 'Emitidos', value: totalIssued, color: '#6366f1' },
      { name: 'Utilizados', value: totalUsed, color: '#10b981' },
      { name: 'Pendentes', value: totalPending, color: '#f59e0b' }
    ];

    return { totalIssued, totalUsed, totalPending, chartData };
  }, [filteredVouchers]);
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedCampaignId === 'all') {
      toast.error("Selecione uma campanha específica para subir a lista.");
      return;
    }

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
          const line = index + 2;
          const keys = Object.keys(row);
          const nameKey = keys.find(k => k.toLowerCase().includes('nome') || k.toLowerCase().includes('completo'));
          const birthKey = keys.find(k => k.toLowerCase().includes('nasci') || k.toLowerCase().includes('data') || k.toLowerCase().includes('aniver'));
          const phoneKey = keys.find(k => k.toLowerCase().includes('tel') || k.toLowerCase().includes('cel') || k.toLowerCase().includes('fone') || k.toLowerCase().includes('whatsapp'));
          
          if (!nameKey || !row[nameKey]) {
            errors.push({ line, error: "Nome não encontrado" });
            return null;
          }
          if (!birthKey || !row[birthKey]) {
             errors.push({ line, error: "Data de nascimento não encontrada" });
             return null;
          }

          const rawName = String(row[nameKey]).trim();
          const rawBirth = String(row[birthKey]).trim();
          const rawPhone = phoneKey ? String(row[phoneKey]).trim() : '';
          
          if (rawName.length < 3) {
            errors.push({ line, error: "Nome muito curto" });
            return null;
          }

          const normalizedDate = normalizeDate(rawBirth);
          if (normalizedDate.length !== 8) {
            errors.push({ line, error: `Data inválida: ${rawBirth}` });
            return null;
          }

          const normalizedName = normalizeString(rawName);
          const normalizedId = `${normalizedName}_${normalizedDate}`;
          
          return { 
            code: normalizedId, 
            name: rawName, 
            birthDate: rawBirth,
            phone: rawPhone,
            campaignId: selectedCampaignId 
          };
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
            toast.error(`${errors.length} linhas com erro.`);
          }
        } else if (errors.length > 0) {
          toast.error("Nenhum dado válido para importar.");
        } else {
          toast.error("Planilha vazia.");
        }
      } catch (err) {
        toast.error("Falha ao processar arquivo Excel.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const exportReport = () => {
    const headers = ['Código', 'Nome', 'Assinante', 'Status', 'Emitido em', 'Utilizado em'];
    const rows = filteredVouchers.map(v => [
      v.code,
      v.name,
      v.customerCode,
      v.status === VoucherStatus.USED ? 'Utilizado' : 'Pendente',
      new Date(v.issuedAt).toLocaleString('pt-BR'),
      v.usedAt ? new Date(v.usedAt).toLocaleString('pt-BR') : '-'
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_vouchers_${user.partner}_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Link copiado!");
  };

  const handleLogout = () => {
    clearPartnerSession();
    window.location.reload();
  };

  const appBaseUrl = window.location.href.split('#')[0];
  const vitrineUrl = `${appBaseUrl}#/cliente`;
  const pdvUrl = `${appBaseUrl}#/operacao`;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Painel da Empresa</h1>
            <p className="text-slate-500 font-medium">Bem-vindo, <span className="text-indigo-600 font-bold">{user.partner}</span></p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={fetchFromFirestore} 
              disabled={loadingCloud}
              className="p-3 bg-white text-indigo-600 rounded-2xl border border-indigo-100 hover:bg-slate-50 disabled:opacity-50 transition-all font-black text-xs uppercase flex items-center gap-2"
              title="Sincronizar com o banco de dados"
            >
               <RefreshCw className={loadingCloud ? "animate-spin" : ""} size={16} /> 
               {loadingCloud ? "Sincronizando..." : "Sincronizar"}
            </button>
            <Link to="/guia-rh" className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all font-black text-xs uppercase flex items-center gap-2">
               <HelpCircle size={16} /> Ver Guia do RH
            </Link>
            <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase ml-2">Campanha:</span>
              <select 
                value={selectedCampaignId} 
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                className="bg-slate-50 border-none outline-none text-sm font-bold text-slate-700 px-3 py-1 rounded-xl cursor-pointer"
              >
                <option value="all">Todas as Campanhas</option>
                {campaigns.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <button onClick={handleLogout} className="p-3 bg-white text-red-500 rounded-2xl border border-red-100 hover:bg-red-50 transition-all font-black text-xs uppercase flex items-center gap-2">
               <LogOut size={16} /> Sair do Painel
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard 
            label="Vouchers Emitidos" 
            value={stats.totalIssued} 
            icon={<Ticket className="text-indigo-600" />} 
            trend="+12% este mês"
          />
          <StatCard 
            label="Vouchers Utilizados" 
            value={stats.totalUsed} 
            icon={<CheckCircle className="text-emerald-600" />} 
            trend={`${((stats.totalUsed / (stats.totalIssued || 1)) * 100).toFixed(1)}% de conversão`}
          />
          <StatCard 
            label="Base Importada" 
            value={whitelist.length} 
            icon={<Users className="text-amber-600" />} 
            trend="Assinantes autorizados"
          />
        </div>

        {/* Links Rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                <LayoutGrid className="text-indigo-600" size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Link da Vitrine (Cliente)</p>
                <p className="text-xs font-bold text-slate-600 truncate max-w-[200px]">{vitrineUrl}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => copyToClipboard(vitrineUrl)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-indigo-600" title="Copiar Link">
                <Copy size={18} />
              </button>
              <a href={vitrineUrl} target="_blank" rel="noreferrer" className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-indigo-600" title="Abrir Vitrine">
                <ExternalLink size={18} />
              </a>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                <Store className="text-emerald-600" size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Link do PDV (Operação)</p>
                <p className="text-xs font-bold text-slate-600 truncate max-w-[200px]">{pdvUrl}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => copyToClipboard(pdvUrl)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-emerald-600" title="Copiar Link">
                <Copy size={18} />
              </button>
              <a href={pdvUrl} target="_blank" rel="noreferrer" className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-emerald-600" title="Abrir PDV">
                <ExternalLink size={18} />
              </a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Gráfico de Uso */}
          <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <TrendingUp className="text-indigo-600" size={20} /> Performance de Uso
              </h3>
              <button 
                onClick={exportReport}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <Download size={14} /> Exportar CSV
              </button>
            </div>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                  />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}} 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                    {stats.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Progress Bars for Limits */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-slate-50">
              {filteredCampaigns.map(c => {
                const now = new Date();
                const currentMonthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
                const monthData = c.months.find(m => m.month === currentMonthStr);
                const issueLimit = c.monthlyLimit || 100;
                const usageLimit = c.monthlyUsageLimit || issueLimit;
                
                const issuePerc = Math.min(100, ((monthData?.issued_count || 0) / issueLimit) * 100);
                const usagePerc = Math.min(100, ((monthData?.used_count || 0) / usageLimit) * 100);

                return (
                  <div key={c.id} className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>Cota de Emissão ({c.name})</span>
                        <span className="text-slate-900">{monthData?.issued_count || 0} / {issueLimit}</span>
                      </div>
                      <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${issuePerc}%` }} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>Cota de Utilização</span>
                        <span className="text-slate-900">{monthData?.used_count || 0} / {usageLimit}</span>
                      </div>
                      <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${usagePerc}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upload de Whitelist */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="text-indigo-600" size={20} /> Gestão de Base
              </h3>
              <button 
                onClick={handleDownloadTemplate}
                title="Baixar Template Excel"
                className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
              >
                <Download size={16} />
              </button>
            </div>
            
            <div className="flex-1 flex flex-col justify-center">
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Suba a lista de colaboradores autorizados. A planilha deve conter as colunas: <strong>Nome Completo</strong> e <strong>Data de Nascimento</strong>.
              </p>

              {importErrors.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Inconsistências Identificadas:</p>
                    <button onClick={() => setImportErrors([])} className="text-red-400 hover:text-red-700">X</button>
                  </div>
                  <div className="max-h-24 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {importErrors.map((err, i) => (
                      <p key={i} className="text-[9px] text-red-500 font-medium">Linha {err.line}: {err.error}</p>
                    ))}
                  </div>
                </div>
              )}
              
              <label className={`
                group flex flex-col items-center justify-center w-full h-48 bg-slate-50 rounded-3xl border-2 border-dashed transition-all text-center p-6
                ${selectedCampaignId === 'all' ? 'opacity-50 cursor-not-allowed border-slate-200' : 'cursor-pointer border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30'}
              `}>
                <UploadCloud className={`w-10 h-10 mb-3 ${selectedCampaignId === 'all' ? 'text-slate-300' : 'text-slate-400 group-hover:text-indigo-500'}`} />
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Upload Planilha</p>
                <p className="text-[10px] text-slate-400 font-medium">Arraste ou clique para selecionar .XLSX</p>
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".xlsx, .xls" 
                  onChange={handleFileUpload} 
                  disabled={selectedCampaignId === 'all'}
                />
              </label>
              
              {selectedCampaignId === 'all' && (
                <p className="mt-4 text-[10px] text-amber-600 font-bold flex items-center gap-1 justify-center">
                  <AlertCircle size={12} /> Selecione uma campanha acima para habilitar o upload.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Lista de Vouchers */}
        <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Tabela de Vouchers */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h3 className="text-lg font-black text-slate-900">Histórico de Emissões</h3>
              <div className="relative w-full md:w-60">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Filtrar emissões..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2 bg-slate-50 rounded-xl border-none ring-1 ring-slate-100 outline-none text-xs font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-100">
                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Colaborador</th>
                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredVouchers.length > 0 ? (
                    filteredVouchers.slice(0, 10).map(v => (
                      <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-4">
                          <p className="font-bold text-slate-700 text-xs">{v.name}</p>
                          <p className="text-[9px] text-slate-400 font-mono tracking-tight">{v.code}</p>
                        </td>
                        <td className="px-8 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            v.status === VoucherStatus.USED 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {v.status === VoucherStatus.USED ? 'Utilizado' : 'Emitido'}
                          </span>
                        </td>
                        <td className="px-8 py-4 text-[10px] text-slate-400 font-medium">
                          {new Date(v.issuedAt).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={3} className="px-8 py-8 text-center text-slate-300 text-xs">Nenhum registro.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabela de Whitelist (Base Importada) */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900">Base de Colaboradores</h3>
              <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                {whitelist.length} Cadastrados
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-100">
                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Nome</th>
                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Aniversário</th>
                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Telefone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {whitelist.length > 0 ? (
                    whitelist.slice(0, 10).map((w, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-4 font-bold text-slate-700 text-xs">{w.name}</td>
                        <td className="px-8 py-4 text-xs text-slate-500 font-medium">{w.birthDate}</td>
                        <td className="px-8 py-4 text-xs text-slate-400 font-mono italic">{w.phone || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={3} className="px-8 py-8 text-center text-slate-300 text-xs">Nenhuma base importada.</td></tr>
                  )}
                </tbody>
              </table>
              {whitelist.length > 10 && (
                <div className="p-4 text-center bg-slate-50/50 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Exibindo os primeiros 10 registros
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string, value: number, icon: React.ReactElement, trend: string }> = ({ label, value, icon, trend }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0">
      {React.cloneElement(icon, { size: 28 } as any)}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-900 leading-none mb-2">{value}</p>
      <p className="text-[10px] font-bold text-slate-400">{trend}</p>
    </div>
  </div>
);

export default ContractorDashboard;
