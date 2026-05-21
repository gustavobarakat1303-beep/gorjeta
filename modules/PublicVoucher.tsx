
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../services/dataService';
import { Voucher, VoucherStatus } from '../types';
import { ShieldCheck, AlertTriangle, Calendar, Store, Info, ChevronLeft, CheckCircle2, Loader2, Home, AlertCircle, Utensils, UtensilsCrossed, CalendarDays, ExternalLink } from 'lucide-react';

const PublicVoucher = () => {
  const { code } = useParams();
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVoucher = async () => {
      if (!code) return;
      try {
        const data = await db.vouchers.getByCode(code);
        setVoucher(data);
      } catch (e) {
        console.error("Fetch error", e);
      } finally {
        setLoading(false);
      }
    };
    fetchVoucher();
  }, [code]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 text-red-500">
          <AlertTriangle size={40} />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">Voucher não encontrado</h1>
        <p className="text-slate-500 mb-8 max-w-xs">O código {code} não foi localizado em nossa base de dados central (Firestore).</p>
        <Link to="/" className="text-indigo-600 font-bold uppercase text-xs tracking-widest flex items-center gap-2">
          <ChevronLeft size={16} /> Voltar ao Início
        </Link>
      </div>
    );
  }

  const campaign = db.campaigns.getById(voucher.campaignId);
  const isUsed = voucher.status === VoucherStatus.USED;
  const isExpired = new Date() > new Date(voucher.expiryDate);
  const isValid = !isUsed && !isExpired;

  const benefitLabel = campaign?.benefit_type === 'percent' 
    ? `${campaign.benefit_value}% OFF` 
    : `R$ ${campaign?.benefit_value?.toFixed(2) || campaign?.value.toFixed(2)}`;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex items-center justify-center relative">
      <Link to="/" className="absolute top-8 left-8 p-3 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-indigo-600 transition-all border border-slate-100">
        <Home size={24} />
      </Link>
      
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
        <div className={`p-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white ${isValid ? 'bg-emerald-500' : isUsed ? 'bg-amber-500' : 'bg-red-500'}`}>
          {isValid ? 'Voucher Válido' : isUsed ? 'Voucher Utilizado' : 'Voucher Expirado'}
        </div>

        <div className="p-8 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden border">
              {campaign?.partner_logo_url ? (
                  <img src={campaign.partner_logo_url} className="w-full h-full object-cover" alt="Logo" />
              ) : <ShieldCheck className="text-indigo-600" size={32} />}
            </div>
            {campaign?.contractor_logo_url && (
              <>
                <div className="text-slate-300 font-black">+</div>
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden border">
                  <img src={campaign.contractor_logo_url} className="w-full h-full object-cover" alt="Contractor" />
                </div>
              </>
            )}
          </div>
          
          <h2 className="text-3xl font-black text-slate-900 mb-1">{benefitLabel}</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{campaign?.partner}</p>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Colaborador Identificado</p>
            <p className="text-lg font-black text-slate-800 text-center uppercase">{voucher.name}</p>
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-2xl mb-8">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Código</p>
            <p className="text-3xl font-black tracking-widest">{voucher.code}</p>
          </div>

          <div className="space-y-4 text-left mb-8">
            <div className="flex items-center gap-3 text-sm">
              <Store className="text-slate-400" size={18} />
              <span className="font-bold text-slate-700">{campaign?.allowedUnits.map(id => db.units.getById(id)?.name).join(', ')}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="text-slate-400" size={18} />
              <span className="font-bold text-slate-700">Validade: {new Date(voucher.expiryDate).toLocaleDateString('pt-BR')}</span>
            </div>

            {campaign?.allowedUnits.map(unitId => {
              const unit = db.units.all().find(u => u.id === unitId);
              if (!unit || (!unit.menuUrl && !unit.reservationUrl)) return null;
              
              return (
                <div key={unitId} className="pt-4 border-t border-slate-100 space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{unit.name}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {unit.menuUrl && (
                      <a 
                        href={unit.menuUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all border border-emerald-100"
                      >
                        <Utensils size={14} /> Cardápio
                      </a>
                    )}
                    {unit.reservationUrl && (
                      <a 
                        href={unit.reservationUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex items-center justify-center gap-2 py-3 px-4 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-100"
                      >
                        <CalendarDays size={14} /> Reservas
                      </a>
                    )}
                  </div>
                </div>
              );
            })}

            {campaign?.rules_text && (
              <div className="bg-indigo-50 p-4 rounded-xl text-[11px] text-indigo-900 italic leading-relaxed border border-indigo-100">
                <AlertCircle size={14} className="mb-1 inline mr-1" /> {campaign.rules_text}
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
            <CheckCircle2 size={12} className={isValid ? 'text-emerald-500' : 'text-slate-300'} />
            Verificado em Tempo Real (Firestore)
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicVoucher;