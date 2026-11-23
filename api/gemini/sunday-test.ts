import {generateSundayTestWithGemini} from '../../server/geminiService';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ok: false, error: 'Method not allowed'});
    return;
  }
  try {
    const result = await generateSundayTestWithGemini(req.body || {});
    res.status(200).json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Gemini Sunday test error';
    res.status(200).json({ok: false, reason: 'API_ERROR', error: msg});
  }
}
