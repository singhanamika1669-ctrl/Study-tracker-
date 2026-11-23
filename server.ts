import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import {
  extractTimetableWithGemini,
  generateSundayTestWithGemini,
  solveQuestionWithGemini,
} from './server/geminiService';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({limit: '15mb'}));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
  });
});

app.post('/api/gemini/solve', async (req, res) => {
  try {
    const result = await solveQuestionWithGemini(req.body || {});
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unable to solve via Gemini';
    res.status(200).json({ok: false, reason: 'API_ERROR', error: msg});
  }
});

app.post('/api/gemini/timetable-ocr', async (req, res) => {
  try {
    const result = await extractTimetableWithGemini(req.body || {});
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unable to extract timetable';
    res.status(200).json({ok: false, reason: 'API_ERROR', error: msg});
  }
});

app.post('/api/gemini/sunday-test', async (req, res) => {
  try {
    const result = await generateSundayTestWithGemini(req.body || {});
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unable to generate test';
    res.status(200).json({ok: false, reason: 'API_ERROR', error: msg});
  }
});

async function startServer() {
  if (!isProduction) {
    const {createServer} = await import('vite');
    const vite = await createServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.use((_req, res) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build not found');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Study Tracker server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
