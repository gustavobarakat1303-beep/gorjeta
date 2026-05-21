
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Smartphone, Scan, CheckCircle2, XCircle, Info, HelpCircle, ArrowRight, Play, X, Layout } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GuidedVideoTutorial } from '../components/GuidedVideoTutorial';

const PartnerGuideModule = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* video Modal */}
      <AnimatePresence>
        {isPlaying && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/95 flex items-center justify-center p-4 md:p-10"
          >
            <button 
              onClick={() => setIsPlaying(false)}
              className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
            >
              <X size={32} />
            </button>
            <div className="w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10">
              <iframe 
                className="w-full h-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" 
                title="Tutorial PDV"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/operacao" className="p-2 text-slate-400 hover:text-indigo-600 transition-all">
              <ChevronLeft size={24} />
            </Link>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">Guia do Parceiro</h1>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Passo a passo operacional</p>
            </div>
          </div>
          <HelpCircle className="text-slate-300" size={24} />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-20">
        
        {/* Intro */}
        <section className="text-center space-y-4">
          <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-100 mb-6 font-black text-white text-2xl">PDV</div>
          <h2 className="text-3xl font-black text-slate-900 leading-none">Como validar vouchers?</h2>
          <p className="text-slate-500 font-medium max-w-lg mx-auto">Siga este guia simples para garantir que seus clientes aproveitem os benefícios corretamente.</p>
        </section>

        {/* Step 1 */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="relative">
             <div className="absolute -left-4 -top-4 w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black z-10 shadow-lg">1</div>
             <div className="bg-slate-900 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden group">
                {/* Mock Screen Login */}
                <div className="bg-white rounded-2xl p-6 space-y-4 transform group-hover:scale-[1.02] transition-all">
                   <div className="w-8 h-8 bg-slate-100 rounded-lg mx-auto mb-2"></div>
                   <div className="h-2 w-20 bg-slate-200 rounded mx-auto"></div>
                   <div className="pt-4 space-y-2">
                      <div className="h-10 bg-slate-50 rounded-xl border-2 border-indigo-500/20"></div>
                      <div className="h-10 bg-slate-50 rounded-xl border-2 border-indigo-500/20"></div>
                      <div className="h-10 bg-indigo-600 rounded-xl"></div>
                   </div>
                </div>
                <div className="absolute bottom-4 right-4 text-white/20"><Smartphone size={48} /></div>
             </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Autenticação</h3>
            <p className="text-slate-500 leading-relaxed font-medium">Acesse <span className="font-bold text-indigo-600">voucherhub.app/operacao</span> e utilize o identificador da sua unidade e a senha de validação (PIN) fornecida pelo gestor.</p>
            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 italic text-amber-700 text-xs font-medium">
              <Info size={16} className="shrink-0" />
              Cada unidade PDV possui um PIN exclusivo para evitar erros de registro.
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 space-y-4 text-right">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Leitura do QR Code</h3>
            <p className="text-slate-500 leading-relaxed font-medium">Clique em <span className="font-bold text-indigo-600">"Abrir Scanner"</span> e aponte a câmera do celular (ou tablet) para o QR Code apresentado pelo cliente.</p>
            <p className="text-slate-400 text-xs font-medium italic">Se a câmera falhar, você pode digitar o código alfanumérico manualmente no campo "CÓDIGO".</p>
          </div>
          <div className="order-1 md:order-2 relative">
             <div className="absolute -right-4 -top-4 w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black z-10 shadow-lg">2</div>
             <div className="bg-slate-900 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden group">
                {/* Mock Scanner */}
                <div className="aspect-square bg-black rounded-2xl p-4 flex flex-col items-center justify-center border-2 border-indigo-500/50">
                   <div className="w-32 h-32 border-2 border-indigo-500/50 rounded-2xl animate-pulse flex items-center justify-center">
                      <Scan className="text-indigo-400" size={48} />
                   </div>
                   <div className="mt-4 h-2 w-24 bg-white/10 rounded"></div>
                </div>
                <div className="absolute bottom-4 left-4 text-white/20"><Scan size={48} /></div>
             </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="relative">
             <div className="absolute -left-4 -top-4 w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black z-10 shadow-lg">3</div>
             <div className="bg-slate-900 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden group">
                {/* Mock Success */}
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center">
                   <CheckCircle2 className="text-emerald-500 mx-auto mb-2" size={32} />
                   <div className="h-4 w-24 bg-emerald-500/20 rounded mx-auto mb-4"></div>
                   <div className="space-y-2">
                      <div className="h-8 bg-white/5 rounded-lg border border-white/10"></div>
                      <div className="h-10 bg-emerald-500 rounded-xl"></div>
                   </div>
                </div>
                <div className="absolute bottom-4 right-4 text-white/20"><CheckCircle2 size={48} /></div>
             </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Confirmação</h3>
            <p className="text-slate-500 leading-relaxed font-medium">Confirme se o <span className="font-bold text-slate-900">nome do titular</span> e o <span className="font-bold text-slate-900">benefício</span> (ex: R$ 50,00 ou 10% OFF) estão corretos.</p>
            <p className="text-slate-500 leading-relaxed font-medium">Clique em <span className="font-bold text-emerald-600 uppercase">"Confirmar Atendimento"</span>. Somente após este clique o voucher é marcado como usado no sistema.</p>
          </div>
        </div>

        {/* Results Info */}
        <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-100">
           <h3 className="text-xl font-black text-slate-900 text-center mb-10 uppercase tracking-widest">Possíveis Resultados</h3>
           <div className="grid md:grid-cols-2 gap-8">
              <div className="flex gap-4 p-6 bg-slate-50 rounded-3xl group hover:bg-emerald-50 transition-colors">
                 <div className="text-emerald-500"><CheckCircle2 size={32}/></div>
                 <div>
                    <h4 className="font-black text-slate-900 uppercase text-xs mb-1">Autorizado</h4>
                    <p className="text-xs text-slate-500 font-medium">O voucher está ativo e é válido para sua unidade. Prossiga com o atendimento normal.</p>
                 </div>
              </div>
              <div className="flex gap-4 p-6 bg-slate-50 rounded-3xl group hover:bg-red-50 transition-colors">
                 <div className="text-red-500"><XCircle size={32}/></div>
                 <div>
                    <h4 className="font-black text-slate-900 uppercase text-xs mb-1">Negado / Já Usado</h4>
                    <p className="text-xs text-slate-500 font-medium">O voucher já foi utilizado ou não é válido para sua unidade. O sistema informará o local de uso.</p>
                 </div>
              </div>
           </div>
        </section>

        {/* Video Tutorial Section */}
        <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-100 space-y-10">
           <div className="text-center">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-2">Treinamento Interativo</h3>
              <p className="text-slate-500 font-medium text-sm">Aprenda a operar o painel de parceiro em poucos segundos.</p>
           </div>
           
           <GuidedVideoTutorial type="merchant" />
        </section>

        {/* Help */}
        <section className="text-center p-12 bg-indigo-600 rounded-[3rem] text-white">
           <h3 className="text-2xl font-black mb-4">Ainda com dúvidas?</h3>
           <p className="text-indigo-100 font-medium mb-8 max-w-sm mx-auto">Fale com seu gestor administrativo ou consulte a central de ajuda da VoucherHub.</p>
           <button className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black shadow-xl flex items-center gap-2 mx-auto hover:scale-105 transition-all">
              Acessar Suporte Técnico <ArrowRight size={18} />
           </button>
        </section>

      </main>
    </div>
  );
};

export default PartnerGuideModule;
