# Deploy (Vercel — gratuito)

O app é uma SPA estática (Vite + React) que usa **Firebase** (Firestore + Login Google) como
backend. Não há servidor próprio para manter — por isso ele roda **de graça** em hospedagem
estática. Migramos do Google App Engine (que gerava custo) para a **Vercel** (plano Hobby, gratuito).

## Publicar pela primeira vez (uma vez, ~3 minutos)

1. Acesse **https://vercel.com** e entre com **Continue with GitHub**.
2. Clique em **Add New… → Project**.
3. Em **Import Git Repository**, selecione `gustavobarakat1303-beep/gorjeta`.
   - Se não aparecer, clique em **Adjust GitHub App Permissions** e dê acesso ao repositório.
4. A Vercel detecta o **Vite** automaticamente (já existe `vercel.json` configurando tudo):
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
5. *(Opcional)* Se quiser usar o **módulo de IA (Agente)**, abra **Environment Variables** e adicione:
   - Name: `GEMINI_API_KEY`  →  Value: sua chave do Google AI Studio.
   - Sem essa chave o app funciona normalmente; apenas o recurso de IA fica inativo.
6. Clique em **Deploy**. Em ~2 min o app fica no ar em uma URL `*.vercel.app`.

A partir daí, **todo push na branch `main` publica automaticamente** — sem custo e sem configurar nada.

## Domínio próprio (`b2b.pedemanga.com.br`) — gratuito

1. No projeto da Vercel: **Settings → Domains → Add** e digite `b2b.pedemanga.com.br`.
2. A Vercel mostra o registro DNS a criar (geralmente um **CNAME** apontando para `cname.vercel-dns.com`).
3. Crie esse registro no seu provedor de DNS (onde gerencia `pedemanga.com.br`).
4. O HTTPS é emitido automaticamente pela Vercel (grátis).

### Autorizar o domínio no Firebase Auth
Como o login é via Firebase (Google), adicione os domínios novos em
**Firebase Console → Authentication → Settings → Authorized domains**:
- `b2b.pedemanga.com.br`
- o domínio `*.vercel.app` gerado (ex.: `gorjeta.vercel.app`)

Sem isso, o login com Google é bloqueado nos domínios novos.

## Parar o custo do Google Cloud

Migrar para a Vercel não desliga sozinho a cobrança antiga. Para zerar o custo do App Engine:

1. **GCP Console → App Engine → Settings → Disable application** (desativa o serviço que gerava o gasto).
2. Confira **Billing → Reports** filtrando por App Engine para confirmar que parou.
3. O **Firestore** e o **Firebase Auth** continuam no plano gratuito (Spark) e podem ficar como estão.
   Se quiser garantir custo zero, em **Billing** verifique se o projeto pode voltar ao plano Spark
   ou defina um **orçamento com alerta** em **Billing → Budgets & alerts**.

> Os arquivos antigos do App Engine (`app.yaml`, `server.js`, `.gcloudignore` e o workflow
> `deploy-appengine.yml`) foram removidos nesta migração. Eles continuam no histórico do Git
> caso precise consultar.

## Rodar localmente

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # gera dist/ (mesma saída publicada na Vercel)
npm run preview  # serve o dist/ localmente para testar
```
