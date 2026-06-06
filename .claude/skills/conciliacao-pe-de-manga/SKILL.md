---
name: conciliacao-pe-de-manga
description: Conciliação mensal de despesas do Pé de Manga cruzando Everest (notas recebidas), planilha Excel de controle e fatura do cartão. Aplica as 3 regras de validação (Excel ⊆ Everest, Cartão ⊆ Excel, Cartão ⊆ Everest), gera planilha .xlsx com abas separadas por violação e um resumo administrativo para o financeiro.
---

# Conciliação de despesas — Pé de Manga

## Pré-requisitos
O usuário deve ter anexado ao prompt:
1. Export do **Everest** ("Manutenção de Notas Recebidas") — `.xlsx`
2. Planilha de **controle no Excel** — `.xlsx`
3. (Opcional) **Fatura do cartão** — `.csv` com colunas `data,lançamento,valor`

Se algum desses estiver faltando, peça antes de prosseguir. Se a fatura do cartão não vier,
as regras 2 e 3 simplesmente não são executadas.

## Pergunte (apenas se não estiver óbvio)
- Mês/ano de competência (se não dá pra inferir pelas datas).

## Passo 1 — Inspecionar os arquivos
Use openpyxl para ler os `.xlsx` e `csv`/`utf-8-sig` para a fatura (cuidado com BOM).
Identifique as colunas pelo cabeçalho — o layout pode mudar de mês.

- **Everest:** Fantasia Fornecedor, DANFE/Número, D. Emissão, V. Total, D. Lançamento.
  A última linha é o TOTAL (fornecedor/doc vazios, valor = soma das notas) — **descarte-a**.
- **Excel:** Fornecedor, Data, Valor, e (quando houver) Vencimento, Documento, Categoria.
- **Cartão:** `data,lançamento,valor`. Use apenas valores positivos.

Mostre ao usuário os totais e contagens detectados antes de seguir.

## Passo 2 — Regras de validação
1. **Excel ⊆ Everest** — tudo do Excel deve estar no Everest.
2. **Cartão ⊆ Excel** — todo gasto do cartão deve estar no Excel.
3. **Cartão ⊆ Everest** — todo gasto do cartão deve estar no Everest.

## Passo 3 — Método de casamento (Excel ↔ Everest)
1. **Primário:** documento + valor (R$ 0,01 de tolerância). Normalize documento:
   `lstrip('0')`, separar quando vier `doc1/doc2` (regex `[\/,;]`).
2. **Fallback:** valor com multiplicidade (multiconjunto via `Counter`).
3. Documento casado mas valor divergente → lista separada "Divergência de valor".

## Passo 4 — Casamento Cartão ↔ Excel/Everest
Por valor com multiplicidade. As descrições do cartão não trazem número da NF.

## Passo 5 — Pontos de atenção
Marque em amarelo na planilha (não exclua):
- Padrão de parcela na descrição: regex `(\d{2})/(\d{2})\s*$` com `1 ≤ a ≤ b ≤ 24`.
- Data anterior ao 1º dia do mês de competência.

## Passo 6 — Gerar planilha `.xlsx`
Abas obrigatórias:
1. **Resumo** — totais de cada base + quadro de pendências.
2. **1_Excel_sem_Everest** — itens do Excel ausentes no Everest.
3. **1b_Divergencia_Valor** — documentos com valor divergente.
4. **2_Cartao_sem_Excel** — gastos do cartão ausentes no Excel.
5. **3_Cartao_sem_Everest** — gastos do cartão ausentes no Everest.
6. **Cartao_sem_nenhum** — gastos do cartão ausentes nos dois.

Estilo:
- Cabeçalho com fundo azul (`305496`) e fonte branca em negrito.
- Linhas de atenção (parcela ou data antiga) com fundo amarelo (`FFF2CC`).
- Largura de colunas ajustada pelo conteúdo (`min(largura+3, 55)`).

## Passo 7 — Resumo administrativo
Gere um `.md` com:
1. **Escopo e regras** aplicadas.
2. **Quadro de pendências** — tabela com qtde, R$ e aba correspondente.
3. **Ações prioritárias** — top 10 da Regra 1 (Excel sem Everest) e top 10 do Cartão.
4. **Pontos de atenção** — tabela dos itens em amarelo + instrução de como tratar:
   - `N=M`: última parcela, pode já estar lançada.
   - `N<M`: em curso, verificar critério interno.
   - Data anterior ao mês: provável compra de mês anterior já lançada.
5. **Como usar a planilha** — guia das abas.
6. **Cronograma sugerido** — D, D+1, D+2, D+3 + revalidação.

Calcule o **total exposto** = Regra 1 + Cartão sem nenhum.

## Passo 8 — Entrega
Envie ao usuário os dois arquivos (planilha + resumo) via SendUserFile e apresente
o quadro de pendências resumido no chat.

## Cuidados
- Cruzamento por valor pode gerar falsos positivos quando há valores repetidos. Avise.
- IOF, anuidade, multas e estornos do cartão: identifique e oriente sobre lançamento.
- Itens de maior valor devem ser conferidos manualmente antes de qualquer ajuste.
