
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronLeft, Smartphone, Ticket, MapPin, Scan, 
  ArrowRight, Info, CheckCircle2, Star, Zap, HelpCircle,
  PlayCircle, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GuidedVideoTutorial } from '../components/GuidedVideoTutorial';

const BeneficiaryGuideModule = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 pb-20">
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
              <XCircle size={32} />
            </button>
            <div className="w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10">
              <iframe 
                className="w-full h-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" 
                title="Tutorial Beneficiário"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="fixed top-0 inset-x-0 bg-white/80 backdrop-blur-xl z-50 border-b border-slate-100">
         <div className="max-w-xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link to="/" className="p-2 -ml-2 text-slate-400 hover:text-indigo-600 transition-all">
               <ChevronLeft size={24} />
            </Link>
            <h1 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">Como Funciona</h1>
            <HelpCircle className="text-slate-200" size={20} />
         </div>
      </header>

      <main className="max-w-xl mx-auto px-6 pt-24 space-y-16">
         
         {/* Welcome Hero */}
         <section className="text-center space-y-4">
            <div className="w-24 h-24 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-200 mb-8 transform -rotate-6">
               <Ticket className="text-white" size={48} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 flex flex-col">
               <span>Pé de Manga</span>
               <span className="text-indigo-600">& Restaurantes</span>
            </h2>
            <p className="text-slate-500 font-medium">Aproveite seu benefício em poucos passos, direto pelo seu celular.</p>
         </section>

         {/* Steps Visual */}
         <div className="space-y-12">
            {/* Step 1 */}
            <motion.div 
               initial={{ opacity: 0, x: -20 }}
               whileInView={{ opacity: 1, x: 0 }}
               className="flex gap-6 group"
            >
               <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-xl shrink-0 z-10">1</div>
                  <div className="w-1 h-full bg-slate-100 -mt-2 group-last:hidden"></div>
               </div>
               <div className="pb-12 space-y-4">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Identificação</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">
                     Acesse o portal da vitrine e insira seu <span className="font-bold text-slate-900">CPF ou Matrícula</span>. 
                  </p>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                     <Smartphone className="text-indigo-600" size={20} />
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Não precisa baixar nada</p>
                  </div>
               </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div 
               initial={{ opacity: 0, x: -20 }}
               whileInView={{ opacity: 1, x: 0 }}
               className="flex gap-6 group"
            >
               <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-xl shrink-0 z-10">2</div>
                  <div className="w-1 h-full bg-slate-100 -mt-2 group-last:hidden"></div>
               </div>
               <div className="pb-12 space-y-4">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Escolha do Benefício</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">
                     Veja as campanhas disponíveis para você. Escolha o restaurante ou o benefício que deseja utilizar agora.
                  </p>
                  <div className="flex gap-2">
                     <div className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">Saldo Mensal</div>
                     <div className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-widest">Uso Diário</div>
                  </div>
               </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div 
               initial={{ opacity: 0, x: -20 }}
               whileInView={{ opacity: 1, x: 0 }}
               className="flex gap-6 group"
            >
               <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-xl shrink-0 z-10">3</div>
                  <div className="w-1 h-full bg-slate-100 -mt-2 group-last:hidden"></div>
               </div>
               <div className="pb-12 space-y-4">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Geração do Voucher</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">
                     Clique em <span className="font-bold text-indigo-600 uppercase">"Gerar Voucher"</span>. Um QR Code exclusivo será criado instantaneamente.
                  </p>
                  <div className="bg-slate-900 rounded-3xl p-6 text-center space-y-3">
                     <div className="w-24 h-24 bg-white rounded-xl mx-auto flex items-center justify-center">
                        <Scan className="text-slate-200" size={48} />
                     </div>
                     <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em]">Valid ID Code</p>
                  </div>
               </div>
            </motion.div>

            {/* Step 4 */}
            <motion.div 
               initial={{ opacity: 0, x: -20 }}
               whileInView={{ opacity: 1, x: 0 }}
               className="flex gap-6 group"
            >
               <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-xl shrink-0 z-10">4</div>
                  <div className="w-1 h-full bg-slate-100 -mt-2 group-last:hidden"></div>
               </div>
               <div className="pb-12 space-y-4">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Utilização no Local</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">
                     Apresente o QR Code ao atendente no fechamento da conta. Ele fará a validação e o desconto será aplicado na hora!
                  </p>
                  <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                     <MapPin className="text-indigo-600 shrink-0" size={20} />
                     <p className="text-xs font-bold text-indigo-900">Válido em todas as unidades parceiras.</p>
                  </div>
               </div>
            </motion.div>
         </div>

         {/* Video Tutorial Section */}
         <section className="space-y-6">
            <h3 className="text-slate-900 font-black uppercase text-xs tracking-widest text-center">Tutorial Interativo</h3>
            <GuidedVideoTutorial type="beneficiary" />
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest text-center">Aprenda a usar em 60 segundos</p>
         </section>

         {/* Tip Section */}
         <section className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-100 space-y-4">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <Star size={20} />
               </div>
               <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs">Dica Pro</h4>
            </div>
            <p className="text-sm text-amber-900/70 font-medium leading-relaxed">
               Você pode tirar uma <span className="font-bold">print da tela</span> do seu voucher se quiser usá-lo mais tarde, mas lembre-se: ele tem uma validade curta para sua segurança!
            </p>
         </section>

         {/* FAQ Mini */}
         <section className="space-y-6 pt-8">
            <h3 className="text-xl font-black text-slate-900 text-center">Perguntas Frequentes</h3>
            <div className="space-y-2">
               <details className="group bg-slate-50 rounded-2xl p-4 cursor-pointer hover:bg-slate-100 transition-colors">
                  <summary className="list-none flex items-center justify-between font-black text-[10px] uppercase tracking-widest text-slate-600">
                     Meu código não funciona? <Zap size={14} className="text-indigo-600" />
                  </summary>
                  <p className="pt-4 text-xs text-slate-500 font-medium leading-relaxed">
                     Verifique se você digitou seu ID corretamente. Se o erro persistir, consulte o RH da sua empresa para garantir que você está na lista de beneficiários.
                  </p>
               </details>
               <details className="group bg-slate-50 rounded-2xl p-4 cursor-pointer hover:bg-slate-100 transition-colors">
                  <summary className="list-none flex items-center justify-between font-black text-[10px] uppercase tracking-widest text-slate-600">
                     Posso usar o mesmo voucher duas vezes? <CheckCircle2 size={14} className="text-indigo-600" />
                  </summary>
                  <p className="pt-4 text-xs text-slate-500 font-medium leading-relaxed">
                     Não. Cada voucher é único e expira assim que é validado no caixa do restaurante escolhido.
                  </p>
               </details>
            </div>
         </section>

         {/* Final CTA */}
         <section className="text-center pt-8">
            <Link 
               to="/"
               className="inline-flex items-center gap-3 px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:scale-105 transition-all"
            >
               Começar a Usar Agora <ArrowRight size={20} />
            </Link>
            <p className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">VoucherHub Experience</p>
         </section>

      </main>
    </div>
  );
};

export default BeneficiaryGuideModule;
