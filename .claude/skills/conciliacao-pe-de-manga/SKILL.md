---
name: conciliacao-pe-de-manga
description: Roda a conciliacao mensal de despesas do Pe de Manga cruzando Excel controle (primario), Everest (secundario) e Fatura Itau (complemento). Use SEMPRE que o usuario mencionar conciliacao mensal, fechar despesas do mes, bater fatura com controle, verificar o que falta lancar, ou anexar 2+ arquivos entre estes tres tipos - Excel controle mensal (Fornecedor/Data/Valor/Setor), Everest export (Manutencao de Notas Recebidas OU Carteira de Titulos a Pagar), fatura Itau xlsx (Fatura Fechada). Dispara com termos como "conciliacao", "fechar mes", "bater a fatura", "verificar lancamentos", "cruzar despesas", "conciliacao Pe de Manga".
---

# Conciliacao mensal Pe de Manga

## Objetivo
Produzir um unico arquivo .xlsx com o cruzamento entre as tres fontes de dados de despesas do Pe de Manga, destacando (a) o que falta lancar em cada controle, (b) pares provaveis de mesma compra registrada de formas diferentes, e (c) duplicidades no Excel.

## Hierarquia dos controles (importante!)
- **Excel controle mensal** = controle **PRIMARIO** (source of truth). Todo lancamento operacional deve estar aqui.
- **Everest** (export "Manutencao de Notas Recebidas" OU "Carteira de Titulos a Pagar") = controle **SECUNDARIO** (deveria bater com o Excel).
- **Fatura Itau** (Fatura Fechada, xlsx) = **COMPLEMENTO**. Tudo que aparece na fatura ja deveria estar no Excel e no Everest.

A saida sempre organiza as 3 reconciliacoes nessa ordem: A = Excel×Everest, B = Fatura×Excel, C = Fatura×Everest.

## Quando invocar
Ativar quando qualquer combinacao ocorrer:
- Usuario pede "conciliacao", "fechar o mes", "bater a fatura", "verificar o que falta lancar", "cruzar despesas".
- Usuario anexa pelo menos o **Excel controle** + 1 dos outros dois arquivos.
- Usuario menciona "Pe de Manga" no contexto de despesas mensais.

## Fluxo de trabalho

### 1. Identificar os arquivos
Descobrir qual anexo eh cada:

| Tipo | Como reconhecer |
|---|---|
| **Excel controle** | Header `Fornecedor / Data / Valor / Setor` em alguma linha (nao necessariamente a primeira). Setores tipicos: COZINHA, BAR, MARKETING, MANUTENÇÃO, ESCRITÓRIO, DESCATAVEIS, EVENTUAL, UTENSILIOS, FUNCIONÁRIO EXTRA. |
| **Everest - Manutencao Notas** | Header comeca em A1 com `Empresa, Fornecedor, Fantasia Fornecedor, Tipo Fornecedor, ...` OU apenas `Fantasia Fornecedor, DANFE, D. Emissao, V. Total, D. Lancamento`. |
| **Everest - Carteira Titulos** | Header em A1 com `Origem, Razao Fornecedor, Parcela, Descricao Portador, D. Lancamento, D. Documento, D. Competencia, V. Original`. Cobre TODOS os portadores (ITAU, CARTAO DE CREDITO, CARTEIRA) - eh a base mais completa. |
| **Fatura Itau** | Nome tipico `faturafechadafinal_XXXX_MES2026.xlsx`. Contem cabecalho com "Fatura Fechada - MES/ANO", linha `Data / Lançamento / Parcelamento / Valor / Titularidade / Nome / Tipo do cartão / Número do cartão`. |

### 2. Confirmar rapidamente com o usuario se ambiguo
- Se receber **Carteira de Titulos** em vez de Manutencao Notas, perguntar se quer **excluir os impostos** (SIMPLES NACIONAL, FGTS, INSS/IRRF, GARE ICMS, ISS). O default deste projeto historicamente eh SIM (`--no-taxes`).
- Se o usuario ja disse "sem impostos" em turno anterior, use `--no-taxes` sem perguntar de novo.

### 3. Rodar o script
```bash
python3 .claude/skills/conciliacao-pe-de-manga/scripts/reconcile.py \
  --excel   <caminho_excel_controle.xlsx> \
  --everest <caminho_everest.xlsx> \
  --fatura  <caminho_fatura_itau.xlsx> \
  --out     /home/user/gorjeta/Conciliacao_Pe_de_Manga_YYYY-MM.xlsx \
  --mes     'MM/YYYY' \
  [--no-taxes]
```

`--excel` eh obrigatorio. `--everest` e `--fatura` sao opcionais (o script pula recon B/C se faltar).

Parametros de tuning (raramente precisam de ajuste):
- `--supplier-threshold 0.55` : score minimo de similaridade de nome (0..1)
- `--tolerance-abs 50.0`      : diferenca absoluta max em R$ para near-match
- `--tolerance-pct 0.05`      : diferenca max relativa (5%)
- `--max-days 10`             : diferenca max de dias entre emissao/data

### 4. Entregar
- Enviar o .xlsx via `SendUserFile` com legenda no formato "Conciliacao Pe de Manga - MMM/YYYY".
- No chat, dar um resumo com:
  - Totais das 3 bases
  - Matches exatos + near
  - Top 5-10 itens de cada lista de "falta" (destacando os DEVE TER DANFE)
  - Duplicidades no Excel
- Commitar no branch atual, criar/atualizar PR draft.

## Estrutura da saida (.xlsx)

| Aba | Conteudo |
|---|---|
| `Resumo` | Totais das bases, contagens de match, observacoes. |
| `A1_Excel_falta_Everest` | Lancamentos do Excel sem correspondente no Everest. Classifica em "Deveria ter NF-e" (mercadoria) ou "Servico/assinatura". |
| `A2_Everest_falta_Excel` | Notas do Everest sem correspondente no Excel. |
| `A3_NearMatch_Excel_Everest` | Pares mesma compra registrada com valor levemente diferente. |
| `B1_Fatura_falta_Excel` | Transacoes da fatura sem lancamento no Excel. Classifica em Mercadoria / Servico / Combustivel. |
| `B2_NearMatch_Fatura_Excel` | Pares fatura↔Excel. |
| `C1_Fatura_falta_Everest` | Transacoes da fatura sem titulo no Everest. |
| `C2_NearMatch_Fatura_Everest` | Pares fatura↔Everest. |
| `Z_Duplicidades_Excel` | Linhas do Excel com mesmo valor+data (possiveis lancamentos em dobro ou mesma compra em 2 nomes). |

## Melhorar o algoritmo com aliases

O arquivo `data/supplier_aliases.json` mapeia variantes de nome para um canonico:

```json
{
  "AMBEV": ["AMBEV S/A CDD", "AMBEV CDD", "CDL SAO PAULO"],
  "KHADUN": ["KHADUN", "KHADUN B. LIMA"]
}
```

Sempre que descobrir que dois fornecedores sao a mesma coisa (fantasia × razao social, ou apelido no cartao), **editar este JSON e adicionar a nova variante**. Isso melhora todas as conciliacoes futuras.

Padroes historicos ja capturados:
- **AMBEV = CDL SAO PAULO**: mesma nota chega com diferenca de R$ 1,55 (recorrente, tratar como igual).
- **BIDFOOD VINHAIS = AVELINOS = DIST IRMAOS AVELINOS**
- **DISTRIB DE FRIOS E LA = CASTELAO**
- **PAMA COMERCIO = PMG**
- **NOVA MEGA G = MEGA G**
- **ST ETIENE PADARIA (Everest) vs ST ETIENNE CITY PADARIA (Excel)** - variantes de nome (mas cuidado: podem ser pedidos diferentes com valores diferentes; conferir data).

## Convencao de nomenclatura de fatura

O Itau chama a fatura pelo **mes do vencimento** (ex: "Fatura Fechada - Agosto/2026" vence 13/08). Mas o usuario se refere pelo **mes das compras** (a fatura que vence em agosto cobre compras feitas em julho, entao chamamos de "fatura de julho").

Convencao a adotar:
- Nome do arquivo de saida: `Conciliacao_Cartao_<MesCompras><ANO>.xlsx` (ex: `Conciliacao_Cartao_Jul2026.xlsx`).
- Rotulo `--mes` no relatorio: `'MM/YYYY (compras) - fatura venc. DD/MM'`.
- O mes das compras = mes do fechamento anterior ao vencimento. Ex: fechou 02/08, vence 13/08 -> compras de meados de 07 a inicio de 08 -> chamamos de "julho".

## Observacoes de dominio

- **Facebook agregado**: A fatura mostra varias cobrancas FACEBK de R$ 130 (uma por dia). No Everest / Excel, isso as vezes vira uma unica entrada consolidada "FACEBOOK R$ X.XXX,XX" pela soma. Se ver muitos FACEBK isolados na lista de "falta", verificar se ha uma entrada agregada nas sobras.
- **Impostos**: nunca cruzam com Excel controle. Excluir sempre que o usuario mandar (`--no-taxes`).
- **Encargos/multas de atraso da fatura**: nao sao lancamentos operacionais. Categorizados como `tipo=encargo` e nao entram nas listas de "falta".
- **Estornos (valores negativos)**: filtrados fora do match; nao contam como "falta lancar".
- **Parceladas**: aparecem varias vezes na fatura (Parcela X de Y). No Everest normalmente eh 1 unica entrada; o cruzamento por valor pega apenas as parcelas com valor identico ao lancamento unico. Confirmar manualmente com o usuario.

## Fluxo git
- Sempre commitar o .xlsx no branch `claude/epic-johnson-R4ZvA` (ou o branch designado do momento).
- Nome padrao: `Conciliacao_Pe_de_Manga_YYYY-MM.xlsx`.
- Se ja existir versao anterior, sufixar `_v2`, `_v3` etc conforme necessario.
