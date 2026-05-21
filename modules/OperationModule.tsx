
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { db, useDataSync, normalizeString } from '../services/dataService';
import { Voucher, VoucherStatus, EstablishmentUnit } from '../types';
import toast from 'react-hot-toast';
import { Search, CheckCircle, XCircle, LogOut, Ticket, ArrowRight, ShieldCheck, Store, Info, Loader2, ChevronLeft, Home, Camera, Minimize2, HelpCircle, ChevronRight } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

const OperationModule = () => {
  useDataSync();
  const [unitId, setUnitId] = useState<string | null>(null);
  const currentUnit = unitId ? db.units.getById(unitId) : null;

  if (!unitId || !currentUnit) return <OpLogin onLogin={setUnitId} />;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-950 text-white p-6 flex flex-col">
      <div className="flex justify-between items-center mb-8 pt-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-white/10 shadow-lg">
             {currentUnit.logoUrl ? <img src={currentUnit.logoUrl} className="w-full h-full object-cover" alt={currentUnit.name} /> : <ShieldCheck className="text-indigo-600" size={24}/>}
          </div>
          <div>
            <h2 className="text-lg font-black leading-none mb-1">{currentUnit.name}</h2>
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Ponto de Venda Ativo</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/guia-parceiro" className="p-2 bg-indigo-500/10 rounded-full text-indigo-400 hover:text-white transition-all flex items-center gap-2 px-4 border border-indigo-500/20">
             <HelpCircle size={18} />
             <span className="text-[10px] font-black uppercase tracking-widest leading-none">Guia</span>
          </Link>
          <Link to="/" className="p-2 bg-white/5 rounded-full text-slate-500 hover:text-white transition-all flex items-center gap-2 px-4">
             <Home size={18} />
             <span className="text-[10px] font-black uppercase tracking-widest">Início</span>
          </Link>
          <button onClick={() => setUnitId(null)} className="p-2 bg-white/5 rounded-full text-slate-500 hover:text-red-400 transition-all flex items-center gap-2 px-4">
             <LogOut size={18} />
             <span className="text-[10px] font-black uppercase tracking-widest">Sair</span>
          </button>
        </div>
      </div>
      
      <Validator unit={currentUnit} />
      
      <div className="mt-8 mb-4">
         <Link to="/guia-parceiro" className="w-full p-4 bg-white/5 rounded-2xl border border-dashed border-white/10 flex items-center justify-between group hover:border-indigo-500/50 transition-all">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all"><HelpCircle size={20} /></div>
               <div>
                  <p className="text-[10px] font-black text-white uppercase tracking-widest">Dúvidas na Validação?</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Ver tutorial passo a passo</p>
               </div>
            </div>
            <ChevronRight className="text-slate-600" size={16} />
         </Link>
      </div>
      
      <div className="mt-auto py-8 text-center">
        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">VoucherHub Enterprise</p>
      </div>
    </div>
  );
};

const OpLogin = ({ onLogin }: any) => {
  const [val, setVal] = useState('');
  const [pass, setPass] = useState('');
  const units = db.units.all();

  const handle = () => {
    const unit = units.find(u => (u.id === val || u.name.toLowerCase().includes(val.toLowerCase())) && u.active);
    
    if (!unit) {
      toast.error('Unidade não encontrada ou inativa.');
      return;
    }

    if (unit.accessCode !== pass.toUpperCase().trim()) {
      toast.error('Senha de acesso incorreta.');
      return;
    }

    onLogin(unit.id);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex items-center justify-center p-8 bg-slate-950">
      <div className="w-full bg-white p-12 rounded-[3.5rem] shadow-2xl relative">
        <Link to="/" className="absolute top-8 left-8 text-slate-300 hover:text-indigo-600 transition-colors">
          <ChevronLeft size={24} />
        </Link>
        <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center mb-8 mx-auto shadow-xl shadow-slate-200">
          <Store className="text-white w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2 text-center tracking-tight">Checkout</h2>
        <p className="text-center text-slate-400 text-sm mb-10 font-medium italic">Autentique sua unidade para validar benefícios.</p>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">ID ou Nome da Unidade</p>
            <input value={val} onChange={e => setVal(e.target.value)} onKeyPress={e => e.key === 'Enter' && handle()} placeholder="Identificação" className="w-full p-5 bg-slate-100 rounded-2xl text-slate-900 text-center font-black outline-none border-2 border-transparent focus:border-indigo-500 transition-all uppercase" />
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Senha de Validação</p>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} onKeyPress={e => e.key === 'Enter' && handle()} placeholder="••••••" className="w-full p-5 bg-slate-100 rounded-2xl text-slate-900 text-center font-black outline-none border-2 border-transparent focus:border-indigo-500 transition-all uppercase" />
          </div>
          <button onClick={handle} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all active:scale-95 mt-4">Acessar PDV</button>
          
          <Link to="/guia-parceiro" className="flex items-center justify-center gap-2 py-4 text-slate-400 hover:text-indigo-600 transition-all text-[10px] font-black uppercase tracking-widest">
             <HelpCircle size={16} /> Como funciona? Ver Guia Operacional
          </Link>
        </div>
      </div>
    </div>
  );
};

const Validator = ({ unit }: { unit: EstablishmentUnit }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerId = "qr-reader";

  useEffect(() => {
    let starting = false;
    let timer: any = null;

    if (isScanning) {
      timer = setTimeout(async () => {
        try {
          starting = true;
          const scannerInstance = new Html5Qrcode(scannerId);
          scannerRef.current = scannerInstance;
          
          const config = { 
            fps: 20, 
            qrbox: (vw: number, vh: number) => {
              const size = Math.min(vw, vh) * 0.75;
              return { width: size, height: size };
            },
            aspectRatio: 1.0
          };

          await scannerInstance.start(
            { facingMode: "environment" },
            (config as any),
            (decodedText) => {
              handleScanSuccess(decodedText);
            },
            () => {} // Silent scan errors
          );
          starting = false;
        } catch (err) {
          starting = false;
          console.error("Camera access error:", err);
          if (err.toString().includes("NotFoundError")) {
            toast.error("Nenhuma câmera encontrada neste dispositivo.");
          } else {
            toast.error("Erro ao acessar câmera. Verifique as permissões.");
          }
          setIsScanning(false);
        }
      }, 500);
    } else {
      if (scannerRef.current) {
        // Only stop if it's not currently in the "starting" phase to avoid race condition
        const stopScanner = async () => {
          try {
            if (scannerRef.current && (scannerRef.current as any).getState() === 2) { // 2 = SCANNING
              await scannerRef.current.stop();
              await scannerRef.current.clear();
            }
            scannerRef.current = null;
          } catch (err) {
            console.error("Error stopping scanner:", err);
          }
        };
        stopScanner();
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (scannerRef.current) {
        const scannerInstance = scannerRef.current;
        const cleanup = async () => {
          try {
            if ((scannerInstance as any).getState() === 2) {
              await scannerInstance.stop();
            }
          } catch (e) {
            // Ignore cleanup errors
          }
        };
        cleanup();
      }
    };
  }, [isScanning]);

  const handleScanSuccess = (decodedText: string) => {
    // Feedback visual imediato
    toast.success("QR Code detectado!", { duration: 1000 });
    
    let cleanCode = decodedText.trim();
    const upperText = cleanCode.toUpperCase();
    
    // Tenta extrair o código da URL de forma mais robusta
    // Suporta /v/CODE, /V/CODE, /v/CODE?param=1, etc.
    const vMatch = upperText.match(/\/V\/([A-Z0-9-]+)/);
    if (vMatch && vMatch[1]) {
      cleanCode = vMatch[1];
    } else if (cleanCode.includes('/')) {
      // Fallback: pega a última parte da URL se contiver barras
      const parts = cleanCode.split('/');
      const lastPart = parts[parts.length - 1].split('?')[0].split('#')[0];
      if (lastPart) cleanCode = lastPart;
    }
    
    const finalCode = normalizeString(cleanCode);
    setCode(finalCode);
    setIsScanning(false);
    
    // Delay para processamento
    setTimeout(() => {
      triggerValidation(finalCode);
    }, 400);
  };

  const validate = async () => {
    triggerValidation(code);
  };

  const triggerValidation = async (codeToValidate: string) => {
    setResult(null);
    let cleanCode = codeToValidate.trim().toUpperCase();
    
    // Mesma lógica de extração para entrada manual de URL (se houver)
    const upperText = cleanCode;
    const vMatch = upperText.match(/\/V\/([A-Z0-9-]+)/);
    if (vMatch && vMatch[1]) {
      cleanCode = vMatch[1];
    } else if (cleanCode.includes('/')) {
      const parts = cleanCode.split('/');
      const lastPart = parts[parts.length - 1].split('?')[0].split('#')[0];
      if (lastPart) cleanCode = lastPart;
    }

    cleanCode = normalizeString(cleanCode);

    if (!cleanCode) return toast.error('Informe o código do voucher.');
    
    setLoading(true);
    try {
      // 1. Tenta buscar como Voucher primeiro
      let voucher = await db.vouchers.getByCode(cleanCode);
      
      // 2. Se não encontrou voucher, tenta buscar como Identidade na Whitelist (Fallback)
      if (!voucher) {
        const campaigns = db.campaigns.all().filter(c => c.active);
        // Se houver apenas uma campanha ativa, podemos tentar ver se o código é um ID da whitelist
        const entry = await db.whitelist.findEntry(cleanCode);
        
        if (entry) {
          return setResult({ 
            status: 'error', 
            msg: `Esta é uma identidade de colaborador (${entry.name}), não um voucher. O colaborador deve primeiro resgatar o benefício na vitrine.` 
          });
        }
        
        return toast.error('Voucher ou Identidade não encontrados.');
      }
      
      if (voucher.status === VoucherStatus.USED) {
        const usedUnit = db.units.getById(voucher.usedStore || '');
        setResult({ 
          status: 'error', 
          msg: `Voucher já utilizado em ${new Date(voucher.usedAt!).toLocaleString()} na unidade ${usedUnit?.name || 'não identificada'}.`, 
          holder: voucher.name 
        });
        return;
      }
      
      const campaign = db.campaigns.getById(voucher.campaignId);
      if (!campaign || !campaign.active) return setResult({ status: 'error', msg: 'A campanha deste voucher está pausada ou expirada.' });
      
      if (!campaign.allowedUnits.includes(unit.id)) {
        return setResult({ status: 'error', msg: `Voucher não autorizado para esta unidade (${unit.name}).` });
      }

      setResult({ status: 'success', voucher, campaign });
    } catch (error) {
      console.error("Validation error:", error);
      toast.error("Erro ao validar voucher.");
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    setLoading(true);
    try {
      await db.vouchers.updateStatus(result.voucher.code, VoucherStatus.USED, unit.id);
      toast.success('Check-out realizado com sucesso!');
      setResult(null);
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center mb-6">
           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Validação de Voucher</label>
           <button 
             onClick={() => setIsScanning(!isScanning)} 
             className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isScanning ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'}`}
           >
             {isScanning ? <><Minimize2 size={14}/> Fechar Câmera</> : <><Camera size={14}/> Abrir Scanner</>}
           </button>
        </div>

        {isScanning ? (
          <div className="relative w-full aspect-square bg-black rounded-3xl overflow-hidden border-4 border-indigo-500/30 shadow-inner">
            <div id={scannerId} className="w-full h-full"></div>
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-indigo-500/50 rounded-3xl animate-pulse"></div>
            </div>
            <p className="absolute bottom-4 left-0 right-0 text-center text-[10px] font-black text-white/50 uppercase tracking-widest">Aponte a câmera para o QR Code</p>
          </div>
        ) : (
          <>
            <input 
              value={code} 
              onChange={e => setCode(e.target.value)} 
              onKeyPress={e => e.key === 'Enter' && validate()} 
              className="w-full bg-slate-950 border-2 border-white/10 p-5 rounded-2xl text-indigo-400 font-mono font-black text-center text-3xl uppercase mb-4 outline-none focus:border-indigo-500 transition-all" 
              placeholder="CÓDIGO" 
            />
            <button onClick={validate} disabled={loading} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" /> : 'Validar Manualmente'}
            </button>
          </>
        )}
      </div>

      {result && (
        <div className={`p-6 rounded-[2.5rem] border-2 animate-in slide-in-from-bottom-6 duration-300 ${result.status === 'success' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
          <div className="flex flex-col items-center text-center">
            {result.status === 'success' ? (
              <>
                <CheckCircle className="text-emerald-500 mb-4" size={48} />
                <h3 className="text-xl font-black text-white mb-1">Identidade Validada</h3>
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.2em] mb-4">Acesso Autorizado</p>
                <div className="w-full space-y-3 mb-6">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-left">
                    <span className="text-[9px] font-black text-slate-500 uppercase block mb-1 tracking-widest">Colaborador Identificado</span>
                    <span className="text-white font-black text-lg">{result.voucher.name}</span>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-left">
                    <span className="text-[9px] font-black text-slate-500 uppercase block mb-1 tracking-widest">Empresa Parceira</span>
                    <div className="flex items-center gap-2">
                       {result.campaign?.contractor_logo_url && <img src={result.campaign.contractor_logo_url} className="w-5 h-5 rounded object-contain bg-white" />}
                       <span className="text-indigo-300 font-bold text-sm uppercase">{result.campaign?.contractor || 'Não identificada'}</span>
                    </div>
                  </div>
                </div>
                <div className="w-full p-4 bg-white/5 rounded-xl border border-dashed border-white/10 text-center mb-6">
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Benefício a ser Aplicado</p>
                   <p className="text-xl font-black text-indigo-400">
                     {result.campaign?.benefit_type === 'percent' 
                       ? `${result.campaign.benefit_value}% de Desconto` 
                       : `R$ ${result.campaign?.benefit_value?.toFixed(2) || result.campaign?.value.toFixed(2)}`}
                   </p>
                </div>
                <button onClick={confirm} disabled={loading} className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3">
                  {loading ? <Loader2 className="animate-spin" /> : 'Confirmar Atendimento'}
                </button>
              </>
            ) : (
              <>
                <XCircle className="text-red-500 mb-4" size={48} />
                <h3 className="text-xl font-black text-white mb-2 uppercase">Negado</h3>
                <p className="text-xs text-slate-400 mb-6">{result.msg}</p>
                <button onClick={() => setResult(null)} className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-2 border-white/5 px-8 py-3 rounded-full">Tentar Outro</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationModule;