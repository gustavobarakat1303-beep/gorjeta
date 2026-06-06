# Prompt — Conciliação mensal de despesas (Pé de Manga)

Cole o texto abaixo e anexe os arquivos do mês:
1. Export do **Everest** ("Manutenção de Notas Recebidas") — `.xlsx`
2. Planilha de **controle no Excel** — `.xlsx`
3. (Opcional) **Fatura do cartão** — `.csv` (data, lançamento, valor)

---

Preciso da conciliação mensal de despesas do **Pé de Manga**, competência **<mês/ano>**.
Anexei:

- **Everest** = export "Manutenção de Notas Recebidas" (Fantasia Fornecedor, DANFE/Número,
  D. Emissão, V. Total, D. Lançamento). A última linha é o TOTAL do rodapé — descarte-a.
- **Excel** = controle manual (Fornecedor, Data, Valor, Vencimento, Documento, e às vezes
  Categoria). Detecte as colunas pelo cabeçalho.
- **Fatura do cartão** (se anexada) = CSV com `data,lançamento,valor`. Pagamentos e estornos
  vêm com valor negativo — desconsidere; use só despesas (valor > 0).

## Diagnóstico em 4 direções (obrigatório)
| | Direção |
|---|---|
| A | Falta no Excel (está no Everest) |
| B | Falta no Everest (está no Excel) |
| C | Cartão sem Excel |
| D | Cartão sem Everest |

Mais: **Divergência de valor** (mesmo doc, valor diferente) e **Cartão sem nenhum** (interseção C∩D).

## Método de casamento
1. **Primário:** documento + valor exato. Normalize o documento (sem zeros à esquerda;
   separe quando vier "doc1/doc2").
2. **Fallback:** valor com multiplicidade (multiconjunto).
3. Cartão ↔ Excel/Everest: só por valor (pode haver falso positivo).

## Pontos de atenção (sinalize em amarelo, não exclua)
- Descrição com padrão de parcela `NN/MM` (ex.: `01/02`, `07/10`, `12/12`).
- Data anterior ao mês de competência.

## Entregáveis
**a) Planilha `.xlsx`** com abas:
- Resumo
- A_Falta_no_Excel
- B_Falta_no_Everest
- Divergencia_Valor
- C_Cartao_sem_Excel
- D_Cartao_sem_Everest
- Cartao_sem_nenhum

**b) Resumo administrativo** (`.md`) com:
1. Escopo e critério de casamento
2. Quadro de diferenças (A, B, C, D + interseção)
3. (A) Falta no Excel — lista ou top valores
4. (B) Falta no Everest — top 10
5. Divergências de valor
6. (C/D) Cartão pendente — top 10
7. Pontos de atenção (parcelamento / data antiga) com instrução de como tratar
8. Como usar a planilha
9. Cronograma sugerido (D, D+1, D+2... até revalidação)

Calcule o **total exposto** = (B) + (Cartão sem nenhum).
Sinalize que itens de maior valor devem ser conferidos manualmente.
