# Prompt — Conciliação mensal de despesas (Nomade)

Cole o texto abaixo e anexe os arquivos do mês:
1. Export do **Everest** ("Manutenção de Notas Recebidas") — `.xlsx`
2. Planilha de **controle no Excel** — `.xlsx`
3. (Opcional) **Fatura do cartão** — `.csv` (data, lançamento, valor)

---

Preciso da conciliação mensal de despesas do **Nomade**, competência **<mês/ano>**.
Anexei:

- **Everest** = export "Manutenção de Notas Recebidas" (Fantasia Fornecedor, DANFE/Número,
  D. Emissão, V. Total, D. Lançamento). A última linha é o TOTAL do rodapé — descarte-a.
- **Excel** = controle manual (Fornecedor, Data, Valor, Vencimento, Documento, e às vezes
  Categoria). Detecte as colunas pelo cabeçalho.
- **Fatura do cartão** (se anexada) = CSV com `data,lançamento,valor`. Pagamentos e estornos
  vêm com valor negativo — desconsidere; use só despesas (valor > 0).

## Regras de validação
1. **Excel ⊆ Everest** — tudo do Excel deve estar no Everest.
2. **Cartão ⊆ Excel** — todo gasto do cartão deve estar no Excel.
3. **Cartão ⊆ Everest** — todo gasto do cartão deve estar no Everest.

## Método de casamento
1. **Primário:** documento + valor exato. Normalize o documento (sem zeros à esquerda;
   separe quando vier "doc1/doc2").
2. **Fallback:** valor com multiplicidade (multiconjunto).
3. Documento casado com valor diferente → aba "Divergência de valor".

## Pontos de atenção (sinalize em amarelo, não exclua)
- Descrição com padrão de parcela `NN/MM` (ex.: `01/02`, `07/10`, `12/12`).
- Data anterior ao mês de competência (provável compra de mês anterior que caiu nesta fatura).

## Entregáveis
**a) Planilha `.xlsx`** com abas:
- Resumo
- 1_Excel_sem_Everest
- 1b_Divergencia_Valor
- 2_Cartao_sem_Excel
- 3_Cartao_sem_Everest
- Cartao_sem_nenhum

**b) Resumo administrativo** (`.md` ou texto) com:
1. Escopo e regras
2. Quadro de pendências (qtde, R$, aba)
3. Ações prioritárias (top 10 de cada lista)
4. Pontos de atenção (parcelamento / data antiga) com instrução de como tratar
5. Como usar a planilha
6. Cronograma sugerido (D, D+1, D+2... até revalidação)

Calcule o **total exposto** = Regra 1 + Cartão sem nenhum.
Sinalize que itens de maior valor devem ser conferidos manualmente.
