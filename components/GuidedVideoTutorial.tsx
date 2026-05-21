
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, MousePointer2, CheckCircle2, 
  UploadCloud, Ticket, ShieldCheck, Play, 
  Pause, RotateCcw, ChevronRight, ChevronLeft, Scan
} from 'lucide-react';

interface Step {
  title: string;
  subtitle: string;
  description: string;
  action: string;
  color: string;
  icon: React.ReactNode;
  mockup: React.ReactNode;
}

interface GuidedVideoTutorialProps {
  type: 'hr' | 'beneficiary' | 'merchant';
}

export const GuidedVideoTutorial: React.FC<GuidedVideoTutorialProps> = ({ type }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const merchantSteps: Step[] = [
    {
      title: "Login do Lojista",
      subtitle: "Acesso ao POS",
      description: "O parceiro acessa seu painel exclusivo para validar vouchers dos clientes.",
      action: "Entrar no sistema",
      color: "bg-slate-900",
      icon: <ShieldCheck size={24} />,
      mockup: (
        <div className="w-full h-full bg-white p-6 flex flex-col justify-center gap-4 relative overflow-hidden">
          <div className="absolute top-4 left-4 bg-slate-900 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full z-10">Interface Lojista</div>
          <div className="space-y-3 relative z-10">
            <div className="w-full h-8 bg-slate-50 border border-slate-100 rounded-lg flex items-center px-3">
               <div className="w-20 h-1.5 bg-slate-200 rounded"></div>
            </div>
            <div className="w-full h-10 bg-slate-900 rounded-lg shadow-lg flex items-center justify-center">
              <div className="w-12 h-2 bg-white/20 rounded"></div>
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-slate-50 rounded-full opacity-50"></div>
        </div>
      )
    },
    {
      title: "Validação de Voucher",
      subtitle: "Leitura de QR Code",
      description: "Use a câmera do celular ou tablet para ler o QR Code apresentado pelo cliente.",
      action: "Abrir Scanner",
      color: "bg-indigo-600",
      icon: <Scan size={24} />,
      mockup: (
        <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center relative">
           <div className="absolute top-4 left-4 bg-indigo-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full z-10">Câmera Ativa</div>
           <div className="w-40 h-40 border-2 border-indigo-500 rounded-3xl relative flex items-center justify-center">
              <motion.div 
                animate={{ y: [-70, 70, -70] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-x-2 h-0.5 bg-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.8)]"
              />
              <Scan className="text-white/10" size={60} />
           </div>
           <p className="mt-4 text-[8px] text-white/40 font-bold uppercase tracking-widest leading-loose">Posicione o código no centro</p>
        </div>
      )
    },
    {
      title: "Confirmar Uso",
      subtitle: "Baixa Automática",
      description: "Após a leitura, clique em confirmar para abater o valor. O saldo é atualizado instantaneamente.",
      action: "Confirmar",
      color: "bg-emerald-500",
      icon: <CheckCircle2 size={24} />,
      mockup: (
        <div className="w-full h-full bg-white p-8 flex flex-col items-center justify-center gap-6 relative">
           <div className="absolute top-4 left-4 bg-emerald-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full z-10">Sucesso</div>
           <motion.div 
             initial={{ scale: 0 }}
             animate={{ scale: 1 }}
             className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center"
           >
              <CheckCircle2 size={40} />
           </motion.div>
           <div className="text-center space-y-2">
              <div className="h-3 w-24 bg-slate-900 mx-auto rounded"></div>
              <div className="h-2 w-32 bg-slate-100 mx-auto rounded"></div>
           </div>
        </div>
      )
    }
  ];

  const hrSteps: Step[] = [
    {
      title: "Acesso Administrativo",
      subtitle: "Login Seguro",
      description: "O RH acessa o painel usando o slug da empresa e a senha master configurada pelo Admin.",
      action: "Clique em Login",
      color: "bg-indigo-600",
      icon: <ShieldCheck size={24} />,
      mockup: (
        <div className="w-full h-full bg-slate-50 p-6 flex flex-col justify-center gap-4 relative">
          <div className="absolute top-4 left-4 bg-indigo-600 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full z-10">Painel do RH</div>
          <div className="w-full max-w-[200px] mx-auto space-y-3">
            <div className="h-8 bg-white border border-slate-200 rounded-lg shadow-sm"></div>
            <div className="h-8 bg-white border border-slate-200 rounded-lg shadow-sm"></div>
            <div className="h-10 bg-indigo-600 rounded-lg shadow-lg flex items-center justify-center">
              <div className="w-12 h-1.5 bg-white/30 rounded"></div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Gestão de Colaboradores",
      subtitle: "Importação via Excel",
      description: "Suba a lista de IDs (CPF ou Matrícula) dos funcionários que terão direito ao benefício.",
      action: "Arraste a planilha",
      color: "bg-emerald-600",
      icon: <UploadCloud size={24} />,
      mockup: (
        <div className="w-full h-full bg-slate-50 p-8 flex flex-col items-center justify-center gap-4 border-4 border-dashed border-slate-200 m-4 rounded-[2rem] relative">
           <div className="absolute top-4 left-4 bg-emerald-600 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full z-10">Upload de Lista</div>
           <UploadCloud className="text-emerald-500 animate-bounce" size={48} />
           <div className="flex gap-2">
              <div className="w-12 h-1.5 bg-slate-200 rounded"></div>
              <div className="w-8 h-1.5 bg-slate-200 rounded"></div>
           </div>
        </div>
      )
    },
    {
      title: "Acompanhamento",
      subtitle: "Dashboard em Tempo Real",
      description: "Veja em tempo real quantos vouchers foram gerados e quem já utilizou o benefício.",
      action: "Ver métricas",
      color: "bg-amber-500",
      icon: <CheckCircle2 size={24} />,
      mockup: (
        <div className="w-full h-full bg-white p-6 space-y-4 relative">
           <div className="absolute top-4 left-4 bg-amber-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full z-10">Monitoramento</div>
           <div className="flex gap-2 mt-8">
             <div className="flex-1 h-16 bg-indigo-50 rounded-2xl border border-indigo-100 flex flex-col p-3 gap-2">
                <div className="w-1/2 h-1.5 bg-indigo-200 rounded"></div>
                <div className="w-full h-4 bg-indigo-600 rounded"></div>
             </div>
             <div className="flex-1 h-16 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col p-3 gap-2">
                <div className="w-1/2 h-1.5 bg-emerald-200 rounded"></div>
                <div className="w-full h-4 bg-emerald-500 rounded"></div>
             </div>
           </div>
           <div className="h-20 bg-slate-50 rounded-2xl border border-slate-100 p-4">
              <div className="w-full h-2 bg-slate-200 rounded mb-2"></div>
              <div className="w-2/3 h-2 bg-slate-100 rounded"></div>
           </div>
        </div>
      )
    }
  ];

  const beneficiarySteps: Step[] = [
    {
      title: "Entrada na Vitrine",
      subtitle: "Acesse pelo link",
      description: "O funcionário acessa o link b2b da empresa pelo navegador do celular, sem baixar apps.",
      action: "Abre o navegador",
      color: "bg-indigo-600",
      icon: <Smartphone size={24} />,
      mockup: (
        <div className="w-[180px] h-full bg-slate-900 rounded-t-[2.5rem] mx-auto p-3 pt-10 relative">
           <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white/20 rounded-full"></div>
           <div className="bg-white h-full rounded-t-2xl p-4 overflow-hidden relative">
              <div className="absolute top-2 left-2 bg-indigo-600 text-white text-[6px] font-black uppercase px-1.5 py-0.5 rounded-full z-10">Vitrine Virtual</div>
              <div className="w-full h-3 bg-slate-100 rounded-full mb-4"></div>
              <div className="flex flex-col gap-2">
                 <div className="w-full h-8 bg-slate-100 rounded-lg"></div>
                 <div className="w-full h-8 bg-indigo-600 rounded-lg"></div>
              </div>
           </div>
        </div>
      )
    },
    {
      title: "Identificação",
      subtitle: "CPF ou Matrícula",
      description: "Ele insere o ID cadastrado pelo RH para validar que é um beneficiário autorizado.",
      action: "Digita o CPF",
      color: "bg-indigo-500",
      icon: <MousePointer2 size={24} />,
      mockup: (
        <div className="w-[180px] h-full bg-slate-900 rounded-t-[2.5rem] mx-auto p-3 pt-10 relative">
           <div className="bg-white h-full rounded-t-2xl p-6 flex flex-col items-center gap-4 relative">
              <div className="absolute top-2 left-2 bg-indigo-500 text-white text-[6px] font-black uppercase px-1.5 py-0.5 rounded-full z-10">Validação</div>
              <ShieldCheck className="text-emerald-500" size={32} />
              <div className="w-full h-0.5 bg-slate-100"></div>
              <div className="w-full h-6 bg-slate-50 border border-emerald-100 rounded flex items-center px-2">
                 <div className="w-12 h-1 bg-slate-200 rounded"></div>
              </div>
           </div>
        </div>
      )
    },
    {
      title: "Uso do Benefício",
      subtitle: "QR Code no Caixa",
      description: "Ao clicar em Gerar Voucher, um QR Code aparece. Basta mostrar ao atendente para abater o valor.",
      action: "Mostra o QR Code",
      color: "bg-emerald-500",
      icon: <Ticket size={24} />,
      mockup: (
        <div className="w-[180px] h-full bg-slate-900 rounded-t-[2.5rem] mx-auto p-3 pt-10 relative">
           <div className="bg-white h-full rounded-t-2xl p-6 flex flex-col items-center gap-4 relative">
              <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[6px] font-black uppercase px-1.5 py-0.5 rounded-full z-10">Voucher Ativo</div>
              <div className="w-20 h-20 bg-slate-900 rounded-xl flex items-center justify-center p-2">
                 <div className="w-full h-full border border-white/20 rounded-md border-dashed"></div>
              </div>
              <div className="w-full h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                 <CheckCircle2 className="text-white" size={16} />
              </div>
           </div>
        </div>
      )
    }
  ];

  const steps = type === 'hr' ? hrSteps : type === 'merchant' ? merchantSteps : beneficiarySteps;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % steps.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, steps.length]);

  return (
    <div className="bg-slate-950 rounded-[3rem] overflow-hidden shadow-2xl border border-white/5 group">
      <div className="relative aspect-video flex flex-col md:flex-row">
        {/* Mockup Display Area */}
        <div className="flex-1 bg-slate-950 relative overflow-hidden flex items-center justify-center min-h-[300px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5, ease: "anticipate" }}
              className="w-full h-full flex items-center justify-center"
            >
              <div className="relative w-full max-w-sm h-4/5">
                 {steps[currentStep].mockup}
              </div>
            </motion.div>
          </AnimatePresence>
          
          {/* Cursor Animation Overlay */}
          <motion.div 
            animate={{ 
              x: isPlaying ? [20, 150, 80, 20] : 20, 
              y: isPlaying ? [40, 80, 160, 40] : 40 
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute z-30 pointer-events-none"
          >
            <div className="bg-indigo-600 p-2 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.6)] border border-indigo-400">
               <MousePointer2 className="text-white fill-white" size={14} />
            </div>
          </motion.div>
        </div>

        {/* Content/Subtitle Area */}
        <div className="w-full md:w-[350px] bg-slate-900 border-t md:border-t-0 md:border-l border-white/5 p-8 flex flex-col justify-between">
           <div className="space-y-8">
              <div className="flex items-center gap-4">
                 <div className={`w-12 h-12 ${steps[currentStep].color} rounded-2xl flex items-center justify-center text-white shadow-xl rotate-3`}>
                    {steps[currentStep].icon}
                 </div>
                 <div>
                    <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Passo {currentStep + 1} de {steps.length}</p>
                    <h3 className="text-base font-black text-white uppercase tracking-tight">{steps[currentStep].subtitle}</h3>
                 </div>
              </div>

              <div className="space-y-4">
                 <h2 className="text-2xl font-black text-white leading-none tracking-tight">{steps[currentStep].title}</h2>
                 <div className="relative bg-slate-950/60 p-4 rounded-xl border border-white/5 shadow-inner">
                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-500 rounded-full" />
                    <p className="text-white text-sm font-semibold leading-relaxed pl-3">
                      {steps[currentStep].description}
                    </p>
                 </div>
              </div>

              <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-600/10 rounded-xl border border-indigo-500/20 w-fit">
                 <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{steps[currentStep].action}</span>
              </div>
           </div>

           {/* Progress and Controls */}
           <div className="space-y-4">
              <div className="flex gap-1">
                 {steps.map((_, idx) => (
                   <div key={idx} className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                      {idx === currentStep && (
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: isPlaying ? '100%' : '0%' }}
                          transition={{ duration: 5, ease: "linear" }}
                          className={`h-full ${steps[idx].color}`}
                        />
                      )}
                      {idx < currentStep && <div className={`h-full ${steps[idx].color} w-full`} />}
                   </div>
                 ))}
              </div>

              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="p-2 text-white/50 hover:text-white transition-colors"
                    >
                       {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                    <button 
                      onClick={() => setCurrentStep(0)}
                      className="p-2 text-white/50 hover:text-white transition-colors"
                    >
                       <RotateCcw size={16} />
                    </button>
                 </div>
                 <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setCurrentStep((prev) => (prev - 1 + steps.length) % steps.length)}
                      className="p-2 text-white/50 hover:text-white transition-colors"
                    >
                       <ChevronLeft size={20} />
                    </button>
                    <button 
                      onClick={() => setCurrentStep((prev) => (prev + 1) % steps.length)}
                      className="p-2 text-white hover:scale-110 transition-transform"
                    >
                       <ChevronRight size={20} />
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </div>
      
      {/* Narrative Legend Overlay */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-700 to-indigo-900 px-8 py-6 text-center border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
         <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.5em] mb-3 flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping"></span>
            Guia Narrado (Legenda Ativa)
         </p>
         <AnimatePresence mode="wait">
           <motion.p 
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-lg md:text-2xl font-black text-white max-w-4xl mx-auto leading-tight italic"
           >
             "{steps[currentStep].description}"
           </motion.p>
         </AnimatePresence>
      </div>
    </div>
  );
};
