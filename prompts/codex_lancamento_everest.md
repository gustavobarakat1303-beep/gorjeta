# Prompt para Codex — Lançamento automatizado de NF recebidas no Everest 3.0

> Cole este prompt no Codex e anexe os arquivos indicados em **Inputs**.
> Codex tem capacidade de executar código, fazer chamadas HTTP e automatizar navegador (Playwright).
> Tudo que estiver entre `<...>` é variável que você preenche antes de enviar.

---

## 1. Contexto

Sou responsável pelo financeiro da empresa **<NOME DA EMPRESA>** (ex.: "Pé de Manga").
Uso o ERP **Everest 3.0 da ACOM Sistemas** (food service). Tenho uma conciliação mensal
pronta entre três fontes: o próprio Everest, uma planilha Excel de controle e a fatura do
cartão. Ela aponta lançamentos que **existem no Excel/cartão mas faltam no Everest**.

Sua missão é **postar os lançamentos faltantes no Everest** com segurança e gerar evidência
auditável.

---

## 2. Inputs anexados

1. `pendencias.xlsx` — planilha de pendências a lançar. Tem as abas:
   - `1_Excel_sem_Everest` — itens já no controle interno que faltam no Everest.
     Colunas: Fornecedor, Data, R$, Documento, Vencimento.
   - `Cartao_sem_nenhum` — gastos do cartão que faltam em ambos os controles.
     Colunas: Data, Descrição, R$, Atenção.
   - `Resumo` — totais e regras aplicadas (apenas referência).
2. `credenciais.env` — arquivo com:
   ```
   EVEREST_API_BASE=https://<host-de-producao>
   EVEREST_API_TOKEN=<token ou client_id+client_secret>
   EVEREST_LOGIN=<usuario>
   EVEREST_SENHA=<senha>
   EVEREST_TENANT=<código da unidade/loja>
   PLANO_DE_CONTAS_DEFAULT=<código contábil default p/ despesas sem categoria>
   ```
3. (Opcional) `mapa_fornecedores.csv` — mapeamento manual de fornecedores quando o
   nome no Excel difere do cadastro no Everest. Colunas: `nome_no_excel`, `cnpj`,
   `codigo_no_everest`.

---

## 3. Estratégia (na ordem)

1. **API REST oficial primeiro.**
   - Documentação base: `https://homologacao.acomsistemas.com.br/docs/`.
   - Autentique conforme a doc (provavelmente OAuth2 client credentials ou bearer token).
   - Identifique os endpoints de:
     - `POST /documentos-fiscais` (DFI) — para itens com número de DANFE.
     - `POST /contas-a-pagar` (CPA) — para serviços/cartão sem DANFE.
     - `GET /fornecedores?cnpj=...` — para resolver fornecedor antes de lançar.
   - Se a doc estiver fora do ar (já vimos 503), tente:
     - `OPTIONS` no host base pra descobrir CORS/endpoints.
     - Ler o swagger/openapi.json se houver (`/swagger.json`, `/openapi.json`,
       `/v3/api-docs`).
     - Contatar a ACOM via e-mail (se o usuário pedir).

2. **Fallback: automação de navegador com Playwright.**
   - Use `headless=False` no primeiro run para o usuário acompanhar.
   - Login pelo portal web do Everest com `EVEREST_LOGIN`/`EVEREST_SENHA`.
   - Navegue até CPA → Inclusão de título e preencha campos. Para DFI, use
     "Manutenção de Notas Recebidas".
   - Tire **screenshot** após cada lançamento bem-sucedido e salve em
     `evidencias/<doc>_<data>.png`.

---

## 4. Regras de segurança (não negociáveis)

1. **Modo `--dry-run` obrigatório no primeiro run.** Não envia nada para o Everest,
   só imprime o payload e simula a navegação. Só rode em modo "live" após o usuário
   aprovar explicitamente.
2. **Idempotência.** Antes de cada POST/digitação, consulte se já existe um título
   no Everest com mesmo `fornecedor + documento + valor`. Se existir, **pule** e
   registre como "já lançado".
3. **Itens com Atenção** (coluna "Atenção" preenchida na planilha — parcelamento ou
   data antiga) **não são lançados automaticamente**. Liste-os em
   `pendencias_revisao_manual.csv` para o usuário decidir um a um.
4. **Cap de valor.** Qualquer item com `R$ > 5.000,00` exige confirmação interativa
   antes de postar (mesmo em modo live). Mostre fornecedor, doc, valor e peça
   `s/n`.
5. **Nunca exponha credenciais** em logs, screenshots ou commits. Sempre leia de
   `credenciais.env` via `python-dotenv`. Adicione `credenciais.env` e
   `evidencias/` no `.gitignore` se for versionar.
6. **Não retente em loop.** Se um lançamento falhar 2 vezes seguidas, marque
   como erro e siga em frente. Não tente "consertar" via OCR ou força bruta.

---

## 5. Mapeamento dos campos

| Origem (planilha) | Destino (Everest CPA / DFI)             | Observação |
|---|---|---|
| Fornecedor       | Fornecedor (lookup por CNPJ/nome)        | Se não achar, registrar erro `FORNECEDOR_NAO_CADASTRADO` |
| Documento        | Número do documento                      | Normalize: sem zeros à esquerda |
| Data             | Data de emissão                          | Formato ISO `YYYY-MM-DD` |
| Vencimento       | Data de vencimento                       | Se vazio, `Data + 30 dias` |
| R$               | Valor                                    | 2 casas decimais |
| (default)        | Plano de contas                          | `PLANO_DE_CONTAS_DEFAULT` |
| (origem)         | Observação                               | `"Lançado via automação | origem: <aba_da_planilha>"` |

Para a aba `Cartao_sem_nenhum` (sem doc/fornecedor estruturado):
- `Documento` → usar `CARTAO_<YYYYMMDD>_<hash6>` (gera string única).
- `Fornecedor` → extrair da `Descrição` (limpar prefixos tipo `FACEBK *`, `DM*`, `MERCADOLIVRE*`).
- Tente bater no `mapa_fornecedores.csv`; se não achar, marcar `FORNECEDOR_NAO_CADASTRADO`
  e pular (não cadastrar fornecedor novo automaticamente).

---

## 6. Workflow

```
1. Carregar pendencias.xlsx e credenciais.env.
2. Carregar mapa_fornecedores.csv (se existir).
3. Tentar autenticar via API. Se OK -> rota_api(). Se falhar -> rota_browser().
4. Para cada item em 1_Excel_sem_Everest + Cartao_sem_nenhum:
   a. Se "Atenção" != vazio -> pendencias_revisao_manual.csv. Continue.
   b. Resolver fornecedor (lookup por CNPJ via mapa, depois por nome via API/UI).
      Se não resolver -> erros.csv com motivo. Continue.
   c. Checar idempotência (fornecedor+doc+valor). Se já existe -> ja_lancados.csv.
   d. Se valor > 5.000 -> confirmação interativa.
   e. Lançar (POST ou navegação UI).
   f. Em sucesso -> append em sucesso.csv com payload + id retornado/screenshot.
   g. Em falha -> append em erros.csv com payload + mensagem da API/HTML do erro.
5. Ao fim, imprimir tabela-resumo:
   - sucesso (qtde, R$)
   - já lançados / idempotência (qtde, R$)
   - revisão manual (qtde, R$)
   - erros (qtde, R$)
   - fornecedor não cadastrado (qtde, R$)
```

---

## 7. Entregáveis

Diretório de saída `out/<YYYY-MM-DD-HHMM>/`:

- `sucesso.csv` — lançamentos confirmados (com id retornado / caminho do screenshot).
- `ja_lancados.csv` — itens idempotentes pulados.
- `pendencias_revisao_manual.csv` — itens com Atenção (não tocados).
- `erros.csv` — falhas, com fornecedor, doc, valor, etapa e mensagem.
- `fornecedor_nao_cadastrado.csv` — itens que requerem cadastro prévio.
- `relatorio.md` — sumário final em Markdown, com tabela-resumo e link/path
  para cada CSV. Inclua um bloco "Próximos passos" para o financeiro
  (ex.: cadastrar X fornecedores e rodar de novo).
- `evidencias/` — screenshots quando usou rota_browser, ou dumps de response
  quando rota_api.

Stack sugerida:
- Python 3.11
- `requests`, `python-dotenv`, `openpyxl`, `pandas`, `playwright` (Chromium).
- `tenacity` para retry com backoff exponencial (máx 2 tentativas por item).

---

## 8. Restrições

- **Não** alterar/desativar registros já existentes no Everest.
- **Não** cadastrar fornecedor novo automaticamente (gerar para revisão).
- **Não** lançar nada em ambiente de produção sem ter rodado `--dry-run` antes e o usuário ter aprovado.
- **Não** commitar `.env`, evidências ou CSVs com dados financeiros em repositório público.
- **Não** seguir o lançamento se a autenticação falhar; pare e peça revisão das credenciais.

---

## 9. Critérios de aceite

Final do run deve cumprir:

1. Todo item processável (sem atenção e com fornecedor resolvido) foi lançado **ou** está em `erros.csv` com causa rastreável.
2. Nenhum lançamento duplicado em relação ao Everest pré-existente.
3. `relatorio.md` mostra os totais e o "saldo a tratar" depois do run.
4. Conciliação seguinte (mês seguinte) deve mostrar **zero** itens na lista "Excel sem Everest" referentes aos itens lançados com sucesso neste run.

---

## 10. Pergunte antes de começar

- Posso rodar em modo `--dry-run` no primeiro run? (Aguarde "sim")
- Em que ambiente (prod/homol)?
- Devo usar API se disponível, ou já partir direto pra Playwright?
- Há plano de contas específico por categoria (Marketing, Cozinha, Manutenção)?
  Se sim, peça o mapa categoria → código contábil.

Se algo na planilha estiver fora do esperado, **pare e pergunte**.
Não invente dados nem tente inferir CNPJ de fornecedor por web search.
