---
name: conciliacao-pe-de-manga
description: Conciliação mensal de despesas do Pé de Manga cruzando Everest (notas recebidas), planilha Excel de controle e fatura do cartão. Gera o diagnóstico completo (4 direções: o que falta no Excel, o que falta no Everest, cartão sem Excel, cartão sem Everest) em uma planilha .xlsx + resumo administrativo.
---

# Conciliação de despesas — Pé de Manga

## Pré-requisitos
O usuário deve ter anexado ao prompt:
1. Export do **Everest** ("Manutenção de Notas Recebidas") — `.xlsx`
2. Planilha de **controle no Excel** — `.xlsx`
3. (Opcional) **Fatura do cartão** — `.csv` com colunas `data,lançamento,valor`

Se algum desses estiver faltando, peça antes de prosseguir. Se a fatura do cartão não vier,
as visões C e D simplesmente não são geradas.

## Pergunte (apenas se não estiver óbvio)
- Mês/ano de competência (se não dá pra inferir pelas datas).

## Passo 1 — Inspecionar os arquivos
Use openpyxl para os `.xlsx` e `csv` com `utf-8-sig` para a fatura (cuidado com BOM).
Identifique as colunas pelo cabeçalho — o layout pode mudar de mês.

- **Everest:** Fantasia Fornecedor, DANFE/Número, D. Emissão, V. Total, D. Lançamento.
  A última linha é o TOTAL (fornecedor/doc vazios, valor = soma das notas) — **descarte-a**.
- **Excel:** Fornecedor, Data, Valor, e (quando houver) Vencimento, Documento, Categoria.
- **Cartão:** `data,lançamento,valor`. Use apenas valores positivos.

Mostre ao usuário os totais e contagens detectados antes de seguir.

## Passo 2 — Diagnóstico em 4 direções (obrigatório)
Sempre produza as quatro visões — o usuário precisa enxergar todas:

| Direção | Descrição |
|---|---|
| A | **Falta no Excel** — está no Everest mas não no controle |
| B | **Falta no Everest** — está no Excel mas não no fiscal |
| C | **Cartão sem Excel** |
| D | **Cartão sem Everest** |

E ainda:
- **Divergência de valor** — mesmo documento com valor diferente entre Everest e Excel.
- **Cartão sem nenhum** — interseção de C e D (foco principal).

## Passo 3 — Método de casamento (Excel ↔ Everest)
1. **Primário:** documento + valor (R$ 0,01 de tolerância). Normalize documento:
   `lstrip('0')`, separar quando vier `doc1/doc2` (regex `[\/,;]`).
2. **Fallback:** valor com multiplicidade (multiconjunto via `Counter`).
3. Documento casado mas valor divergente → lista "Divergência de valor".

## Passo 4 — Casamento Cartão ↔ Excel/Everest
Por valor com multiplicidade. As descrições do cartão não trazem número da NF.
Sinalize ao usuário que esse cruzamento pode ter falsos positivos.

## Passo 5 — Pontos de atenção
Marque em amarelo na planilha (não exclua):
- Padrão de parcela na descrição: regex `(\d{2})/(\d{2})\s*$` com `1 ≤ a ≤ b ≤ 24`.
- Data anterior ao 1º dia do mês de competência.

## Passo 6 — Gerar planilha `.xlsx`
Abas obrigatórias:
1. **Resumo** — totais de cada base + quadro das 4 diferenças.
2. **A_Falta_no_Excel** — Everest sem Excel (verde no cabeçalho).
3. **B_Falta_no_Everest** — Excel sem Everest (azul).
4. **Divergencia_Valor** — documentos com valor divergente.
5. **C_Cartao_sem_Excel** — cartão sem Excel (vermelho).
6. **D_Cartao_sem_Everest** — cartão sem Everest (vermelho).
7. **Cartao_sem_nenhum** — interseção C∩D (foco principal).

Estilo:
- Cabeçalho com fonte branca em negrito.
- A: fundo verde (`548235`). B e Divergência: azul (`305496`). C, D, sem_nenhum: vermelho (`C00000`).
- Linhas de atenção: fundo amarelo (`FFF2CC`).
- Largura de colunas ajustada pelo conteúdo (`min(largura+3, 60)`).

## Passo 7 — Resumo administrativo
Gere um `.md` com:
1. **Escopo** — bases conciliadas e critério de casamento.
2. **Quadro de diferenças** — tabela com as 4 direções (qtde, R$, aba).
3. **(A) Falta no Excel** — lista completa ou top valores.
4. **(B) Falta no Everest** — top 10 + subtotal.
5. **Divergências de valor** — tabela.
6. **(C/D) Cartão pendente** — top 10.
7. **Pontos de atenção** — tabela dos itens em amarelo + instrução de como tratar:
   - `N=M`: última parcela, pode já estar lançada.
   - `N<M`: em curso, verificar critério interno.
   - Data anterior ao mês: provável compra de mês anterior já lançada.
8. **Como usar a planilha** — guia das abas.
9. **Cronograma sugerido** — D, D+1, D+2, D+3 + revalidação.

Calcule o **total exposto** = (B) + (Cartão sem nenhum).

## Passo 8 — Entrega
Envie ao usuário os dois arquivos (planilha + resumo) via SendUserFile e apresente
o quadro das 4 diferenças no chat.

## Cuidados
- Cruzamento por valor pode gerar falsos positivos. Avise.
- IOF, anuidade, multas e estornos do cartão: identifique e oriente.
- Itens de maior valor devem ser conferidos manualmente antes de qualquer ajuste.
