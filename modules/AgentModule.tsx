
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { salvarVoucherCloudRun } from '../services/dataService';
import { Bot, Send, User, Loader2, ChevronLeft, Home } from 'lucide-react';
import toast from 'react-hot-toast';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AgentModule: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Olá! Sou o assistente inteligente do VoucherHub. Posso te ajudar a registrar novos vouchers no sistema. O que deseja fazer hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const salvarVoucherFunctionDeclaration: FunctionDeclaration = {
    name: 'salvarVoucherCloudRun',
    parameters: {
      type: Type.OBJECT,
      description: 'Registra um novo voucher no sistema externo.',
      properties: {
        cliente: { type: Type.STRING, description: 'Nome do cliente' },
        telefone: { type: Type.STRING, description: 'Telefone (apenas números)' },
        valor: { type: Type.NUMBER, description: 'Valor do benefício' },
        origem: { type: Type.STRING, description: 'Sempre "AI Studio"' },
        criadoEm: { type: Type.STRING, description: 'Data ISO-8601' }
      },
      required: ['cliente', 'telefone', 'valor', 'origem', 'criadoEm'],
    },
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          ...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction: `Você é o Agente de Registro do VoucherHub. Seu objetivo é coletar: nome do cliente, telefone e valor. Ao obter esses dados, use a função salvarVoucherCloudRun.`,
          tools: [{ functionDeclarations: [salvarVoucherFunctionDeclaration] }]
        }
      });

      let modelText = response.text || "";
      const fcs = response.functionCalls;

      if (fcs && fcs.length > 0) {
        for (const fc of fcs) {
          if (fc.name === 'salvarVoucherCloudRun') {
            const result = await salvarVoucherCloudRun(fc.args as any);
            const followUp = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: [
                { role: 'user', parts: [{ text: `A função retornou: ${JSON.stringify(result)}` }] }
              ],
              config: { systemInstruction: "Confirme o registro e pergunte se há mais algo." }
            });
            modelText = followUp.text || "Voucher registrado com sucesso!";
          }
        }
      }

      setMessages(prev => [...prev, { role: 'model', text: modelText }]);
    } catch (error) {
      console.error(error);
      toast.error("Erro na comunicação com a IA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-screen flex flex-col bg-white md:border-x border-slate-200">
      <header className="p-6 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-slate-50 rounded-full transition-colors">
            <ChevronLeft className="text-slate-400" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center">
              <Bot className="text-white w-6 h-6" />
            </div>
            <h1 className="text-lg font-black text-slate-900 leading-none">Agente VoucherHub</h1>
          </div>
        </div>
        <Link to="/" className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-all font-black text-[10px] uppercase tracking-widest">
           <Home size={16}/> Sair
        </Link>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-4 rounded-2xl text-sm font-medium shadow-sm max-w-[80%] ${
              m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-100 text-slate-800'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && <div className="text-xs font-bold text-slate-400 animate-pulse">Agente pensando...</div>}
      </div>

      <div className="p-6 bg-white border-t border-slate-100 flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSend()}
          placeholder="Digite sua mensagem..."
          className="flex-1 p-4 bg-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-violet-500 font-medium"
        />
        <button onClick={handleSend} disabled={loading} className="p-4 bg-violet-600 text-white rounded-2xl hover:bg-violet-700">
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default AgentModule;