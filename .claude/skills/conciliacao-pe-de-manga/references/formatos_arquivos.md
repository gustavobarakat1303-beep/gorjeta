# Formatos dos arquivos suportados

## 1. Excel controle mensal
Layout esperado (header pode nao estar na linha 1):

| Fornecedor | Data | Valor | Setor |
|---|---|---|---|
| AMBEV S/A CDD | 2026-07-13 | 2042.26 | BAR |
| ... | ... | ... | ... |

- Header eh detectado automaticamente procurando "Fornecedor", "Data", "Valor".
- Linhas apos o ultimo dado (com fornecedor vazio) sao ignoradas — incluindo o rodape de total.

## 2. Everest — Manutencao de Notas Recebidas
Header na linha 1:

`Empresa | Fornecedor | Fantasia Fornecedor | Tipo Fornecedor | Grupo Economico | Numero | Serie | DANFE | D. Emissao | V. Total | Documentos Referenciados | Pedidos Vinculados | Situacao | D. Lancamento`

ou versao reduzida:

`Fantasia Fornecedor | DANFE | D. Emissao | V. Total | D. Lancamento`

- Fornecedor usado: coluna **Fantasia Fornecedor**.
- Valor usado: **V. Total**.
- Rodape (linha sem fantasia) eh descartado.

## 3. Everest — Carteira de Titulos a Pagar
Header na linha 1:

`Origem | Razao Fornecedor | Parcela | Descricao Portador | D. Lancamento | D. Documento | D. Competencia | V. Original`

- Fornecedor usado: coluna **Razao Fornecedor**.
- Valor usado: **V. Original** (fallback: V. Saldo, V. Atualizado, V. Total).
- Se `--no-taxes`, exclui linhas onde o Razao Fornecedor casar com `\b(SIMPLES NACIONAL|GARE|ICMS|FGTS|INSS|IRRF|IRPJ|PIS|COFINS|DARF|DAS|ISS|IPTU|IPVA|IMPOSTO|TRIBUTO|SEFAZ|GNRE|CSLL|ISSQN|CPP|GPS)\b`.
- Cobertura ampla: inclui TODOS os portadores (ITAU boleto/PIX + CARTAO DE CREDITO + CARTEIRA).

## 4. Fatura Itau (Fatura Fechada)
Layout com cabecalho institucional nas primeiras linhas. O header das transacoes esta em algum lugar:

`Data | Lançamento | Parcelamento | Valor | Titularidade | Nome | Tipo do cartão | Número do cartão`

- Detecta o header procurando por 'DATA', 'LANÇAMENTO'/'LANCAMENTO', 'VALOR' na mesma linha.
- Classifica automaticamente cada linha:
  - `pagamento` — "Pagamento Efetuado"
  - `anuidade` — contem "anuidade"
  - `encargo` — contem "iof", "multa por atraso", "encargos de atraso", "juros de"
  - `transacao` — todo o resto
- Apenas `transacao` com valor positivo entra nos cruzamentos.

## Notas de robustez

- **Openpyxl warning "no default style"** eh apenas warning; ignorar.
- Se o header for detectado em posicao inesperada, verificar se o export foi truncado ou salvou como CSV disfarcado de xlsx.
- Datas: tolera `datetime`, `date`, ou string ISO. Coloca None quando nao consegue parsear.
