# Deploy

A produção (`b2b.pedemanga.com.br`) roda em **Google App Engine** no projeto `gen-lang-client-0421404408`.

## Deploy imediato — Cloud Shell (60 segundos)

Abra este link (entra autenticado, sem instalar nada):

https://shell.cloud.google.com/cloudshell/open?cloudshell_git_repo=https://github.com/gustavobarakat1303-beep/gorjeta&cloudshell_git_branch=main&cloudshell_workspace=.&cloudshell_print=DEPLOY.md

Quando o terminal abrir, cole:

```bash
gcloud config set project gen-lang-client-0421404408 && gcloud app deploy --quiet
```

App Engine vai rodar `npm install` → `npm run gcp-build` (build do Vite) → start com `npm start`. Leva 2–3 minutos.

## Validar pós-deploy

No DevTools console em `https://b2b.pedemanga.com.br/`:

```js
fetch('/').then(r=>r.text()).then(t=>console.log('bundle:',t.match(/index-[A-Za-z0-9_-]+\.js/)?.[0]))
```

Se o hash for diferente de `CisH764u.js` → versão nova no ar.

## Auto-deploy via GitHub Actions (configurar uma vez)

O workflow `.github/workflows/deploy-appengine.yml` já está pronto. Para ativar:

1. **Criar service account no GCP** (Cloud Shell ou Console):
   ```bash
   gcloud iam service-accounts create gh-deploy --display-name="GitHub Deploy"
   PROJECT=gen-lang-client-0421404408
   SA=gh-deploy@$PROJECT.iam.gserviceaccount.com
   gcloud projects add-iam-policy-binding $PROJECT --member="serviceAccount:$SA" --role=roles/appengine.deployer
   gcloud projects add-iam-policy-binding $PROJECT --member="serviceAccount:$SA" --role=roles/appengine.serviceAdmin
   gcloud projects add-iam-policy-binding $PROJECT --member="serviceAccount:$SA" --role=roles/cloudbuild.builds.editor
   gcloud projects add-iam-policy-binding $PROJECT --member="serviceAccount:$SA" --role=roles/storage.admin
   gcloud iam service-accounts keys create key.json --iam-account=$SA
   cat key.json
   ```

2. **No GitHub**: Settings → Secrets and variables → Actions → New secret
   - Name: `GCP_SA_KEY`
   - Value: cole o conteúdo de `key.json`

3. **Pronto** — todo push em `main` faz deploy automático.

## Estrutura

- `app.yaml` — config App Engine Standard nodejs20
- `server.js` — Express servindo `dist/`
- `package.json` — `start` (run server), `gcp-build` (build Vite)
- `.gcloudignore` — exclusões do upload
