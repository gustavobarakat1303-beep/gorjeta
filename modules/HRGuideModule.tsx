
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronLeft, Users, FilePlus, BarChart3, ShieldCheck, 
  ArrowRight, PlayCircle, Info, CheckCircle2, Download, 
  MousePointer2, UploadCloud, Copy, FileSpreadsheet, Smartphone, HelpCircle, Building2, XCircle, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GuidedVideoTutorial } from '../components/GuidedVideoTutorial';

const HRGuideModule = () => {
  const [activeTab, setActiveTab] = useState<'cadastrar' | 'monitorar' | 'ajuda'>('cadastrar');
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Video Modal */}
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
                title="Tutorial RH"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Visual */}
      <div className="bg-indigo-600 pt-12 pb-24 px-6 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-400 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <Link to="/contratante" className="inline-flex items-center gap-2 text-indigo-100 hover:text-white transition-colors mb-8 font-bold text-xs uppercase tracking-widest">
            <ChevronLeft size={16} /> Voltar ao Painel
          </Link>
          <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 backdrop-blur-xl border border-white/20 shadow-2xl">
            <Building2 className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-4">Guia do RH / Contratante</h1>
          <p className="text-indigo-100 text-lg max-w-xl mx-auto font-medium">
            Tudo o que você precisa saber para gerenciar os benefícios da sua equipe com eficiência e segurança.
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 -mt-12 relative z-20">
        {/* Navigation Tabs */}
        <div className="bg-white p-2 rounded-3xl shadow-xl flex gap-2 mb-12 border border-slate-200">
           <button 
             onClick={() => setActiveTab('cadastrar')}
             className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'cadastrar' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:bg-slate-50'}`}
           >
             <FilePlus size={16} /> 1. Cadastrar Colaboradores
           </button>
           <button 
             onClick={() => setActiveTab('monitorar')}
             className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'monitorar' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:bg-slate-50'}`}
           >
             <BarChart3 size={16} /> 2. Monitorar Uso
           </button>
           <button 
             onClick={() => setActiveTab('ajuda')}
             className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'ajuda' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:bg-slate-50'}`}
           >
             <HelpCircle size={16} /> 3. Suporte ao Funcionário
           </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'cadastrar' && (
            <motion.div 
              key="cadastrar"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="grid md:grid-cols-2 gap-16 items-center">
                <div className="space-y-6">
                   <h2 className="text-3xl font-black text-slate-900 leading-tight">Como habilitar o acesso da sua equipe?</h2>
                   <p className="text-slate-500 font-medium leading-relaxed">
                     Para que um colaborador consiga retirar seu voucher, o ID (CPF ou Matrícula) dele precisa estar na "Lista de Autorizados" (Whitelist).
                   </p>
                   
                   <div className="space-y-4">
                      <div className="flex gap-4 p-5 bg-white rounded-3xl border border-slate-200 shadow-sm">
                         <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                            <CheckCircle2 size={24} />
                         </div>
                         <div>
                            <h4 className="font-black text-slate-900 text-xs uppercase mb-1">Passo 1: Login</h4>
                            <p className="text-xs text-slate-500">Acesse seu painel com o slug da empresa e senha administrativa.</p>
                         </div>
                      </div>
                      <div className="flex gap-4 p-5 bg-white rounded-3xl border border-slate-200 shadow-sm">
                         <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                            <UploadCloud size={24} />
                         </div>
                         <div>
                            <h4 className="font-black text-slate-900 text-xs uppercase mb-1">Passo 2: Importar Lista</h4>
                            <p className="text-xs text-slate-500">Clique em "Importar Base" para subir uma planilha Excel com os nomes e códigos.</p>
                         </div>
                      </div>
                   </div>
                </div>
                
                {/* Visual Simulation of Import */}
                <div className="bg-slate-900 rounded-[3rem] p-8 shadow-2xl relative">
                   <div className="bg-white rounded-2xl overflow-hidden shadow-xl border border-slate-700/50">
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-400"></div>
                        <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                      </div>
                      <div className="p-6 space-y-4">
                         <div className="h-4 w-1/2 bg-slate-100 rounded"></div>
                         <div className="grid grid-cols-3 gap-2">
                            <div className="h-20 bg-indigo-50 rounded-xl border border-indigo-100 flex flex-col items-center justify-center gap-2">
                               <FileSpreadsheet className="text-indigo-600" size={24} />
                               <span className="text-[8px] font-black uppercase text-indigo-400">Subir .xlsx</span>
                            </div>
                            <div className="h-20 bg-slate-50 rounded-xl border border-slate-100"></div>
                            <div className="h-20 bg-slate-50 rounded-xl border border-slate-100"></div>
                         </div>
                         <div className="space-y-1">
                            <div className="h-6 bg-slate-900 rounded-lg animate-pulse"></div>
                            <div className="h-2 w-full bg-slate-100 rounded"></div>
                            <div className="h-2 w-3/4 bg-slate-100 rounded"></div>
                         </div>
                      </div>
                   </div>
                   <div className="absolute -bottom-4 -right-4 bg-emerald-500 text-white p-4 rounded-3xl shadow-xl font-black text-xs flex items-center gap-2">
                      <CheckCircle2 size={20} /> 152 Funcionários Adicionados
                   </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'monitorar' && (
            <motion.div 
              key="monitorar"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="grid md:grid-cols-2 gap-16 items-center">
                <div className="order-2 md:order-1 bg-white rounded-[3rem] p-10 border border-slate-200 shadow-xl space-y-6">
                   <div className="flex items-center justify-between mb-8">
                      <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Painel em Tempo Real</h3>
                      <div className="px-2 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-[8px] font-black uppercase">Live</div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-2xl">
                         <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Vouchers Emitidos</p>
                         <p className="text-2xl font-black text-slate-900">842</p>
                      </div>
                      <div className="p-4 bg-indigo-50 rounded-2xl">
                         <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">Vouchers Usados</p>
                         <p className="text-2xl font-black text-indigo-600">315</p>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <div className="h-8 bg-slate-50 rounded-xl border-l-4 border-emerald-500 flex items-center px-4 justify-between">
                         <span className="text-[10px] font-bold text-slate-600 leading-none">João Silva usou no Pé de Manga</span>
                         <span className="text-[8px] text-slate-400">há 2min</span>
                      </div>
                      <div className="h-8 bg-slate-50 rounded-xl border-l-4 border-indigo-500 flex items-center px-4 justify-between">
                         <span className="text-[10px] font-bold text-slate-600 leading-none">Maria Souza emitiu voucher UOL</span>
                         <span className="text-[8px] text-slate-400">há 5min</span>
                      </div>
                   </div>
                </div>

                <div className="order-1 md:order-2 space-y-6 text-right">
                   <h2 className="text-3xl font-black text-slate-900 leading-tight">Acompanhe a adesão em tempo real</h2>
                   <p className="text-slate-500 font-medium leading-relaxed">
                     O painel administrativo mostra quantos vouchers foram emitidos, quais parceiros são os mais visitados e o percentual de uso do seu orçamento mensal.
                   </p>
                   <div className="flex flex-col items-end gap-3 text-right">
                      <div className="flex items-center gap-3">
                         <p className="text-sm font-bold text-slate-900">Relatórios Exportáveis</p>
                         <Download className="text-indigo-600" size={20} />
                      </div>
                      <div className="flex items-center gap-3">
                         <p className="text-sm font-bold text-slate-900">Gráficos de Performance</p>
                         <BarChart3 className="text-indigo-600" size={20} />
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'ajuda' && (
            <motion.div 
              key="ajuda"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
               <section className="bg-indigo-900 rounded-[3rem] p-12 text-white overflow-hidden relative">
                  <div className="absolute right-0 bottom-0 opacity-10 -rotate-12 translate-x-12 translate-y-12">
                    <Smartphone size={320} />
                  </div>
                  
                  <div className="relative z-10 max-w-2xl">
                    <h2 className="text-3xl font-black mb-6">Como o Funcionário usa?</h2>
                    <p className="text-indigo-100 font-medium mb-8">O processo é 100% digital e sem necessidade de baixar aplicativos.</p>
                    
                    <div className="space-y-6">
                       <div className="flex gap-6 items-start">
                          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center shrink-0 border border-white/20 font-black">1</div>
                          <div>
                             <p className="font-black uppercase text-xs tracking-widest mb-1 text-white">Acesse o Link</p>
                             <p className="text-sm text-indigo-200">Ele acessa <span className="text-white font-bold">b2b.pedemanga.com.br/cliente</span></p>
                          </div>
                       </div>
                       <div className="flex gap-6 items-start">
                          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center shrink-0 border border-white/20 font-black">2</div>
                          <div>
                             <p className="font-black uppercase text-xs tracking-widest mb-1 text-white">Identificação</p>
                             <p className="text-sm text-indigo-200">Insere o CPF ou Matrícula que você cadastrou no sistema.</p>
                          </div>
                       </div>
                       <div className="flex gap-6 items-start">
                          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center shrink-0 border border-white/20 font-black">3</div>
                          <div>
                             <p className="font-black uppercase text-xs tracking-widest mb-1 text-white">Retirada</p>
                             <p className="text-sm text-indigo-200">Escolhe o benefício e apresenta o QR Code no restaurante.</p>
                          </div>
                       </div>
                    </div>

                    <div className="mt-12 p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
                       <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">Dica para o RH</p>
                       <p className="text-xs leading-relaxed italic opacity-80">
                         Recomendamos enviar o link acima via Communicação Interna ou WhatsApp junto com o ID de cada colaborador para facilitar o primeiro acesso.
                       </p>
                    </div>
                  </div>
               </section>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video Tutorial Section */}
        <section className="mt-24 space-y-10">
           <div className="text-center">
              <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-widest text-center">Treinamento Interativo</h2>
              <p className="text-slate-500 font-medium mb-10 text-center">Acompanhe o passo a passo com telas reais e explicações detalhadas.</p>
           </div>
           
           <GuidedVideoTutorial type="hr" />
        </section>

        {/* Support CTA */}
        <section className="mt-24 text-center space-y-8 bg-slate-900 p-16 rounded-[4rem] text-white">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/20 rounded-full text-indigo-400 font-black text-[9px] uppercase tracking-widest border border-indigo-500/20">
              <ShieldCheck size={14} /> Suporte Dedicado
           </div>
           <h3 className="text-4xl font-black leading-tight max-w-xl mx-auto">Precisa de ajuda com a operação?</h3>
           <p className="text-slate-400 font-medium max-w-md mx-auto italic">Nossa equipe está pronta para ajudar na importação da sua base ou no treinamento da sua equipe de RH.</p>
           <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 hover:bg-indigo-500 transition-all">
                 Falar com Consultor <ArrowRight size={20} />
              </button>
              <button className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-white/10 transition-all">
                 Baixar Kit de Comunicação <Download size={20} />
              </button>
           </div>
        </section>
      </main>
    </div>
  );
};

export default HRGuideModule;
