import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const app = express();

app.use(express.static(distDir, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('index.html') || filePath.endsWith('sw.js')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else if (/\.(?:js|css|woff2?|png|jpg|svg|webp|ico)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
}));

app.get('*', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(distDir, 'index.html'));
});

const port = Number(process.env.PORT) || 8080;
app.listen(port, () => {
  console.log(`VoucherHub serving on :${port}`);
});
