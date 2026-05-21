# Guia de Publicação na Google Play Store (VoucherHub)

Este aplicativo foi configurado como um **PWA (Progressive Web App)** de alta performance, o que permite sua publicação na Google Play Store usando a tecnologia **Trusted Web Activity (TWA)**.

## Requisitos Prévios
1. Uma conta de desenvolvedor no [Google Play Console](https://play.google.com/console).
2. Ter o Node.js instalado em sua máquina local.

---

## Passo 1: Preparar o Ambiente
Em seu terminal local (fora deste editor), instale a ferramenta oficial do Google para conversão:
```bash
npm install -g @bubblewrap/cli
```

## Passo 2: Inicializar o Projeto Android
Crie uma pasta local e inicialize o Bubblewrap apontando para a URL pública do seu app:
```bash
bubblewrap init --manifest=https://SUA-URL-DO-APP.run.app/manifest.webmanifest
```
*Substitua `https://SUA-URL-DO-APP.run.app/` pela URL do seu app aqui no AI Studio.*

## Passo 3: Gerar o Pacote Digital Asset Links
Para que o app não exiba a barra de endereços do navegador (parecendo um app nativo), você precisa validar a propriedade do domínio:
1. O Bubblewrap gerará um arquivo chamado `assetlinks.json`.
2. Você deve colocar este arquivo na pasta `.well-known/` na raiz do seu site.
3. No AI Studio, você pode criar o arquivo em `/public/.well-known/assetlinks.json`.

## Passo 4: Build e Assinatura
Gere o arquivo `.aab` (Android App Bundle) que será enviado para a loja:
```bash
bubblewrap build
```

## Passo 5: Upload no Google Play Console
1. Entre no [Play Console](https://play.google.com/console).
2. Crie um novo App.
3. Vá em "Produção" ou "Testes fechados".
4. Faça o upload do arquivo `.aab` gerado pelo Bubblewrap.
5. Preencha os detalhes (descrição, prints, etc.) e envie para revisão.

---

## Dicas de Sucesso
- **Ícones**: Já configuramos ícones maskables no `manifest.json` para que fiquem perfeitos no Android (sem bordas brancas).
- **Offline**: O plugin `vite-plugin-pwa` injetado no projeto garante que o app funcione mesmo sem internet (cache instantâneo).
- **Splash Screen**: O Android gerará automaticamente a tela de abertura baseada no `background_color` e `icon` definidos no manifest.
