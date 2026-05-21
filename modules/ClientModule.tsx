
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db, useDataSync, normalizeString, normalizeDate } from '../services/dataService';
import { Voucher, VoucherStatus, Campaign } from '../types';
import { generateShortCode } from '../services/cryptoService';
import toast from 'react-hot-toast';
import { Ticket, ArrowRight, AlertCircle, LayoutGrid, ChevronLeft, Store, Home, ShieldCheck, HelpCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const ClientModule = () => {
  useDataSync();
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [loading, setLoading] = useState(false);

  const activeCampaigns = db.campaigns.all().filter(c => c.active);

  const handleGenerate = async () => {
    if (!selectedCampaign) return;
    
    if (!fullName || !birthDate) {
      return toast.error('Preencha seu nome e data de nascimento.');
    }

    const normalizedName = normalizeString(fullName);
    const normalizedDate = normalizeDate(birthDate);
    const normalizedId = `${normalizedName}_${normalizedDate}`;
    
    setLoading(true);
    try {
      const entry = await db.whitelist.findEntry(normalizedId, selectedCampaign.id);
      if (!entry) {
        setLoading(false);
        return toast.error(`Colaborador não encontrado. Verifique se o nome e a data de nascimento estão idênticos aos da sua empresa.`);
      }

      const now = new Date();
      const monthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      
      const existingVoucher = await db.vouchers.checkMonthlyExists(normalizedId, selectedCampaign.id, monthKey);
      if (existingVoucher) {
        setVoucher(existingVoucher);
        setLoading(false);
        return toast.success(`Você já resgatou este benefício este mês.`);
      }

      const code = normalizeString(generateShortCode(selectedCampaign.partner));
      
      let expiryDate = selectedCampaign.hardStopDate;
      if (selectedCampaign.voucherValidityDays) {
        const expiry = new Date(now);
        expiry.setDate(expiry.getDate() + selectedCampaign.voucherValidityDays);
        const hardStop = new Date(selectedCampaign.hardStopDate);
        expiryDate = (expiry < hardStop ? expiry : hardStop).toISOString();
      }
      
      const newVoucher: Voucher = {
        id: crypto.randomUUID(),
        code: code,
        customerCode: normalizedId, // Use normalized ID for consistent lookups
        name: entry.name,
        campaignId: selectedCampaign.id,
        status: VoucherStatus.ISSUED,
        issuedAt: now.toISOString(),
        expiryDate: expiryDate
      };

      await db.vouchers.save(newVoucher);
      
      setVoucher(newVoucher);
      toast.success('Resgatado com sucesso!');
    } catch (e: any) {
      console.error("Redemption Error:", e);
      let errorMsg = 'Erro ao processar resgate.';
      if (e.message && e.message.includes('permission-denied')) {
        errorMsg = 'Erro de permissão no servidor. Contate o administrador.';
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (voucher) return <VoucherDisplay voucher={voucher} onBack={() => { setVoucher(null); setSelectedCampaign(null); setFullName(''); setBirthDate(''); }} />;

  if (selectedCampaign) {
    const benefitText = selectedCampaign.benefit_type === 'percent' 
        ? `${selectedCampaign.benefit_value}% de Desconto` 
        : `R$ ${selectedCampaign.benefit_value?.toFixed(2) || selectedCampaign.value.toFixed(2)}`;

    return (
      <div className="max-w-md mx-auto min-h-screen bg-white p-8 pt-16 flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-8">
          <button onClick={() => setSelectedCampaign(null)} className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase"><ChevronLeft size={16}/> Voltar</button>
            <Link to="/guia-beneficiario" className="text-slate-400 hover:text-indigo-600 transition-all flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest border border-slate-100 rounded-xl px-3 py-1 bg-white shadow-sm">
               <HelpCircle size={14} /> Ajuda
            </Link>
            <Link to="/" className="text-slate-400 hover:text-indigo-600 transition-colors"><Home size={20}/></Link>
        </div>
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-100">
            {selectedCampaign.partner_logo_url ? (
                <img src={selectedCampaign.partner_logo_url} className="w-full h-full object-cover rounded-2xl" alt={selectedCampaign.partner} />
            ) : (
                <Ticket className="text-white w-8 h-8" />
            )}
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-1 text-center">{selectedCampaign.partner}</h1>
        <p className="text-slate-500 text-center mb-10 text-sm">Validar benefício de <strong>{benefitText}</strong>.</p>
        <div className="w-full space-y-4">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Nome Completo</p>
            <input 
              type="text" 
              placeholder="Como na planilha da empresa" 
              value={fullName} 
              onChange={e => setFullName(e.target.value)} 
              className="w-full p-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none transition-all text-lg font-bold" 
            />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Data de Nascimento</p>
            <input 
              type="text" 
              placeholder="DD/MM/AAAA" 
              value={birthDate} 
              onChange={e => setBirthDate(e.target.value)} 
              className="w-full p-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none transition-all text-lg font-bold" 
            />
          </div>
          <button 
            onClick={handleGenerate} 
            disabled={loading || !fullName || !birthDate} 
            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl disabled:opacity-50 disabled:shadow-none transition-all"
          >
            {loading ? 'Validando...' : 'Resgatar Benefício'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 p-6 flex flex-col">
      <header className="pt-12 mb-10 relative">
        <Link to="/" className="absolute left-0 top-12 p-2 bg-white rounded-xl shadow-sm text-slate-400 hover:text-indigo-600 transition-all border border-slate-100">
          <ChevronLeft size={20} />
        </Link>
        <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center mx-auto mb-4 relative">
           <LayoutGrid className="text-white" size={24}/>
           <Link to="/" className="absolute -left-12 top-0 p-3 bg-white text-slate-400 rounded-xl shadow-sm border border-slate-100 hover:text-indigo-600 transition-all">
              <Home size={18} />
           </Link>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight text-center">VoucherHub Vitrine</h1>
      </header>
      <div className="space-y-4">
        {activeCampaigns.map(c => {
          const firstUnit = db.units.getById(c.allowedUnits[0]);
          const benefitLabel = c.benefit_type === 'percent' ? `${c.benefit_value}% OFF` : `R$ ${c.benefit_value?.toFixed(2) || c.value.toFixed(2)}`;
          
          return (
            <button key={c.id} onClick={() => setSelectedCampaign(c)} className="w-full bg-white p-6 rounded-[2rem] border border-slate-200 text-left hover:border-indigo-500 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden border border-slate-100 relative">
                      {c.partner_logo_url ? (
                        <img src={c.partner_logo_url} className="w-full h-full object-cover" alt={c.partner} />
                      ) : firstUnit?.logoUrl ? (
                        <img src={firstUnit.logoUrl} className="w-full h-full object-cover" alt={c.partner} />
                      ) : (
                        <Store size={18} className="text-slate-300" />
                      )}
                      {c.contractor_logo_url && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden p-0.5">
                          <img src={c.contractor_logo_url} className="w-full h-full object-contain" />
                        </div>
                      )}
                   </div>
                   <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{c.partner}</span>
                </div>
                <ArrowRight size={16} className="text-slate-300" />
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-1 leading-tight">{c.name}</h3>
              <p className="text-2xl font-black text-slate-900 mb-4">{benefitLabel}</p>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                <AlertCircle size={12}/> Válido em: {c.allowedUnits.map(id => db.units.getById(id)?.name).join(', ')}
              </div>
            </button>
          )
        })}
      </div>
      
      <div className="mt-12 flex items-center justify-center gap-2 opacity-30 pb-8">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Cloud Sync Ativo</span>
      </div>
    </div>
  );
};

const VoucherDisplay = ({ voucher, onBack }: any) => {
  const campaign = db.campaigns.getById(voucher.campaignId);

  const base = window.location.href.split("#")[0];
  const voucherUrl = `${base}#/v/${voucher.code}`;

  const benefitText = campaign?.benefit_type === 'percent' 
    ? `${campaign.benefit_value}% OFF` 
    : `R$ ${campaign?.benefit_value?.toFixed(2) || campaign?.value.toFixed(2)}`;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center animate-in fade-in duration-500 overflow-y-auto">
      <div className="w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 relative">
        <div className="bg-indigo-600 p-8 text-white text-center flex flex-col items-center">
          <div className="flex gap-4 items-center mb-4">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-lg border-2 border-white">
                {campaign?.contractor_logo_url ? <img src={campaign.contractor_logo_url} className="w-full h-full object-cover" alt="Empresa" /> : <ShieldCheck size={28} className="text-indigo-600" />}
              </div>
              <div className="text-left">
                <p className="text-[8px] font-black uppercase tracking-[0.25em] opacity-80">Identificação Digital</p>
                <h2 className="text-lg font-black tracking-tight leading-tight">{campaign?.contractor}</h2>
                <div className="flex items-center gap-1 mt-0.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                   <span className="text-[7px] font-black uppercase tracking-widest opacity-60">Colaborador Verificado</span>
                </div>
              </div>
          </div>
          <div className="w-full mt-4 pt-4 border-t border-white/20 flex justify-between items-end">
             <div className="text-left">
                <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Benefício</p>
                <p className="text-2xl font-black">{benefitText}</p>
             </div>
             <div className="text-right">
                <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Para uso em</p>
                <p className="text-xs font-black uppercase">{campaign?.partner}</p>
             </div>
          </div>
        </div>
        
        <div className="p-6 flex flex-col items-center text-center">
          <div className="mb-4 bg-slate-50 p-5 rounded-[2rem] border-2 border-dashed border-slate-200 shadow-inner flex items-center justify-center overflow-hidden">
            <QRCodeSVG value={voucherUrl} size={160} level="H" includeMargin={true} />
          </div>
          <div className="mb-6">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Nome do Titular</p>
            <p className="text-xl font-black text-slate-900 truncate max-w-[280px] uppercase">{voucher.name}</p>
          </div>
          <div className="w-full py-4 px-6 bg-slate-950 rounded-[1.5rem] mb-6 shadow-inner">
            <p className="text-[10px] font-black text-indigo-400 uppercase mb-1 tracking-widest">Código do Benefício</p>
            <p className="text-2xl font-black text-white tracking-widest">{voucher.code}</p>
          </div>
          <div className="w-full grid grid-cols-2 gap-4 text-left text-xs mb-6">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Local</p>
              <p className="font-bold text-slate-800 truncate">{campaign?.allowedUnits.map(id => db.units.getById(id)?.name).join(', ')}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Validade</p>
              <p className="font-bold text-slate-800">{new Date(voucher.expiryDate).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
          {campaign?.rules_text && (
            <div className="w-full p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-left">
              <p className="text-[9px] font-black text-indigo-400 uppercase mb-2 tracking-widest flex items-center gap-1">
                <AlertCircle size={10} /> Regras da Campanha
              </p>
              <p className="text-[11px] text-indigo-900 leading-relaxed italic">
                {campaign.rules_text}
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-6 mt-6">
        <button onClick={onBack} className="text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
          <ChevronLeft size={14} /> Voltar
        </button>
        <Link to="/" className="text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
          <Home size={14} /> Início
        </Link>
      </div>
    </div>
  );
};

export default ClientModule;