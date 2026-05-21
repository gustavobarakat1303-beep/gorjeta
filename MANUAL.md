# Manual Descritivo - VoucherHub Platform

Este manual fornece orientações para os diferentes perfis de usuários da plataforma VoucherHub.

---

## 1. Módulo do Administrador (Master)
**Acesso:** `/admin`
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
**Acesso:** `/operacao`
**Público:** Garçons, caixas ou gerentes das unidades parceiras.

### Validação de Vouchers
1. Clique em **"Escanear QR Code"** para abrir a câmera.
2. Aponte para o QR Code apresentado pelo cliente (celular ou impresso).
3. O sistema extrairá o código automaticamente e consultará a validade.
4. **Resultados Possíveis:**
   - ✅ **Validado:** Exibe o valor do benefício e o nome do titular. O consumo deve prosseguir.
   - ❌ **Já Utilizado:** Informa data e local onde já foi usado para evitar fraudes.
   - ❌ **Unidade Não Autorizada:** O voucher é válido, mas não naquela loja específica.

### Log de Utilização Local
- Visualize os últimos vouchers validados na sua unidade para conferência rápida.

---

## 3. Módulo do Colaborador (Cliente)
**Acesso:** `/cliente`
**Público:** Funcionários das empresas parceiras.

### Resgate de Benefício
1. O colaborador acessa com seu identificador (CPF ou Matrícula) e data de nascimento.
2. O sistema valida se ele está na **Whitelist** da campanha ativa.
3. Se elegível, o voucher é gerado instantaneamente com um QR Code único.

### Voucher Digital
- O colaborador pode salvar o link do voucher ou apresentar o QR Code diretamente no estabelecimento.
- O voucher exibe links rápidos para o **Cardápio** e **Reservas** da unidade.

---

## 4. Agente de IA (Atendimento Inteligente)
**Acesso:** `/agente`
**Público:** Todos os usuários.

O Agente de IA permite interagir com a plataforma via linguagem natural. 
- **Exemplo:** "Quantos vouchers foram usados hoje no Pé de Manga?"
- **Exemplo:** "Quem é o responsável pela campanha da UOL?"
- O agente tem acesso à base de dados para auxiliar na tomada de decisão rápida.

---

## 5. Módulo das Empresas Contratantes
**Acesso:** `/contratante`
**Público:** RH e Gestores das empresas que contratam o VoucherHub (ex: UOL, FIAT).

- Permite que a própria empresa visualize o engajamento de seus colaboradores.
- Visualização de KPIs: Total de resgates vs. Total de colaboradores ativos.

---

## Melhores Práticas e Segurança
1. **QR Code:** Certifique-se de que a tela do cliente esteja com brilho alto para facilitar a leitura da câmera.
2. **Offline First:** O aplicativo funciona offline para consulta de vouchers já carregados, mas a validação final (queima do voucher) exige conexão com a internet.
3. **Senhas de Unidade:** Cada unidade possui seu próprio código de acesso para garantir que os registros de utilização sejam auditáveis por loja.
