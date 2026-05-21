import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Printer, ChevronLeft, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const manualContent = `
# Manual Descritivo - VoucherHub Platform

Este manual fornece orientações para os diferentes perfis de usuários da plataforma VoucherHub.

---

## 1. Módulo do Administrador (Master)
**Acesso:** \`/admin\`
**Público:** Gestores da plataforma.

### Auditoria e Monitoramento
- **Filtros em Tempo Real:** Pesquise por nome, CPF/Matrícula ou código do voucher.
- **Lista de Vouchers:** Visualize o status de cada benefício (Emitido, Ativo ou Utilizado).
- **Dados de Utilização:** Veja exatamente quando e em qual unidade o voucher foi validado.
- **Exportação:** Baixe a lista completa em Excel para fechamentos financeiros.

### Gestão de Campanhas
- **Configuração de Benefícios:** Defina valores fixos ou percentuais de desconto.
- **Limites:** Configure limites mensais por colaborador ou limites totais por campanha.
- **Unidades Autorizadas:** Escolha em quais PDVs (lojas/unidades) o voucher será válido.
- **Modos de Elegibilidade:**
  - *Whitelist:* Apenas colaboradores cadastrados podem resgatar.
  - *Público:* Qualquer pessoa com o link pode resgatar (campanhas abertas).

### Gestão de Equipe (Multi-Admin)
- No menu "Equipe Admin", você pode autorizar outros e-mails do Google a acessarem o painel.
- **Nota:** É necessário fornecer o **UID** do usuário (disponível no console do Firebase ou informando o suporte).

---

## 2. Módulo da Unidade / Operação PDV
**Acesso:** \`/operacao\`
**Público:** Garçons, caixas ou gerentes das unidades parceiras.

### Validação de Vouchers
1. Clique em **"Escanear QR Code"** para abrir a câmera.
2. Aponte para o QR Code apresentado pelo cliente (celular ou impresso).
3. O sistema extrairá o código automaticamente e consultará a validade.
4. **Resultados Possíveis:**
   - ✅ **Validado:** Exibe o valor do benefício e o nome do titular. O consumo deve prosseguir.
   - ❌ **Já Utilizado:** Informa data e local onde já foi usado para evitar fraudes.
   - ❌ **Unidade Não Autorizada:** O voucher é válido, mas não naquela loja específica.

---

## 3. Módulo do Colaborador (Cliente)
**Acesso:** \`/cliente\`
**Público:** Funcionários das empresas parceiras.

### Resgate de Benefício
1. O colaborador acessa com seu identificador (CPF ou Matrícula) e data de nascimento.
2. O sistema valida se ele está na **Whitelist** da campanha ativa.
3. Se elegível, o voucher é gerado instantaneamente com um QR Code único.

---

## 4. Agente de IA (Atendimento Inteligente)
**Acesso:** \`/agente\`
**Público:** Todos os usuários.

O Agente de IA permite interagir com a plataforma via linguagem natural. 
- **Exemplo:** "Quantos vouchers foram usados hoje no Pé de Manga?"
- O agente tem acesso à base de dados para auxiliar na tomada de decisão rápida.

---

## 5. Módulo das Empresas Contratantes
**Acesso:** \`/contratante\`
**Público:** RH e Gestores das empresas que contratam o VoucherHub.

---

## Melhores Práticas e Segurança
1. **QR Code:** Certifique-se de que a tela do cliente esteja com brilho alto para facilitar a leitura da câmera.
2. **Offline First:** O aplicativo funciona offline para consulta de vouchers já carregados, mas a validação final exige conexão com a internet.
3. **Senhas de Unidade:** Cada unidade possui seu próprio código de acesso exclusivo.
`;

const ManualModule = () => {
  const navigate = useNavigate();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Hidden on Print */}
      <div className="print:hidden border-b border-slate-100 sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-all"
          >
            <ChevronLeft size={20} /> Voltar
          </button>
          
          <div className="flex gap-4">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              <Printer size={18} /> Imprimir Manual
            </button>
          </div>
        </div>
      </div>

      {/* Manual Content */}
      <div className="max-w-4xl mx-auto px-8 py-12 print:py-0 print:px-0">
        <div className="flex items-center gap-4 mb-8 print:mb-6">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 print:shadow-none print:bg-black">
            <Download size={24} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter print:text-5xl">Manual do Usuário</h1>
            <p className="text-slate-500 font-medium">VoucherHub Platform • Guia de Operação</p>
          </div>
        </div>

        <div className="prose prose-slate max-w-none 
          prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-900
          prose-h1:text-5xl prose-h2:text-3xl prose-h2:mt-12 prose-h2:pb-4 prose-h2:border-b prose-h2:border-slate-100
          prose-p:text-slate-600 prose-p:leading-relaxed prose-p:text-lg
          prose-li:text-slate-600 prose-li:text-lg
          prose-strong:text-slate-900 prose-strong:font-black
          prose-hr:my-10 print:prose-h2:mt-8 print:prose-hr:my-6
        ">
          <ReactMarkdown>{manualContent}</ReactMarkdown>
        </div>

        {/* Footer - Hidden on Print */}
        <div className="mt-20 pt-10 border-t border-slate-100 text-center print:hidden">
          <p className="text-slate-400 font-medium italic">© 2026 VoucherHub Platform. Todos os direitos reservados.</p>
        </div>
      </div>

      {/* Print-only Footer */}
      <div className="hidden print:block fixed bottom-0 left-0 right-0 py-6 border-t border-slate-100 text-sm text-slate-400 text-center">
        Página gerada automaticamente pela Plataforma VoucherHub em {new Date().toLocaleDateString('pt-BR')}
      </div>
    </div>
  );
};

export default ManualModule;
