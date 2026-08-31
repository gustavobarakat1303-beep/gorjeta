# Exemplos de uso

## Chamada tipica (mes completo)
```bash
python3 .claude/skills/conciliacao-pe-de-manga/scripts/reconcile.py \
  --excel   /root/.claude/uploads/xxx/Excel_07.2026.xlsx \
  --everest /root/.claude/uploads/xxx/Manutencao_Notas_Recebidas.xlsx \
  --fatura  /root/.claude/uploads/xxx/faturafechadafinal_agosto2026.xlsx \
  --out     /home/user/gorjeta/Conciliacao_Pe_de_Manga_2026-07.xlsx \
  --mes     '07/2026'
```

## Com Carteira de Titulos (mais completo) sem impostos
```bash
python3 .claude/skills/conciliacao-pe-de-manga/scripts/reconcile.py \
  --excel   /root/.claude/uploads/xxx/Excel_06.2026.xlsx \
  --everest /root/.claude/uploads/xxx/Carteira_Titulos_a_Pagar.xlsx \
  --fatura  /root/.claude/uploads/xxx/faturafechadafinal_julho2026.xlsx \
  --out     /home/user/gorjeta/Conciliacao_Pe_de_Manga_2026-06.xlsx \
  --mes     '06/2026' \
  --no-taxes
```

## So Excel × Everest (sem fatura)
```bash
python3 .claude/skills/conciliacao-pe-de-manga/scripts/reconcile.py \
  --excel   /path/excel.xlsx \
  --everest /path/everest.xlsx \
  --out     /home/user/gorjeta/Conciliacao.xlsx \
  --mes     '07/2026'
```

## Tuning para meses com muita variacao de nome
Se aparecerem muitos "Excel sem Everest" e "Everest sem Excel" que sao obviamente os mesmos fornecedores, relaxar o threshold:
```bash
--supplier-threshold 0.45   # default 0.55, quanto menor mais matches (com risco de falso positivo)
--tolerance-abs 100.0       # default 50, tolera diferenca maior de valor
--max-days 15               # default 10, tolera diferenca maior de datas
```

## Depois de rodar

1. Enviar o .xlsx via `SendUserFile`
2. Postar resumo no chat com o TOP 5-10 de "Excel sem Everest" (DEVE TER DANFE) e "Everest sem Excel"
3. Se encontrar novo par obvio de fornecedores equivalentes, **adicionar em `data/supplier_aliases.json`** antes de commitar
4. `git add` + `git commit` + `git push` no branch designado
