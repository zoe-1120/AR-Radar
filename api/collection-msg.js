// Vercel serverless function — 应收账款雷达 催收话术代理
// 前端 POST { prompt } 到 /api/collection-msg；密钥只存在后端环境变量，永不下发到浏览器。
// 在 Vercel 项目 Settings → Environment Variables 里设置 ANTHROPIC_API_KEY。

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: '只支持 POST' });
    return;
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    res.status(500).json({ error: '后端缺少环境变量 ANTHROPIC_API_KEY' });
    return;
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const prompt = body.prompt;
    if (!prompt) {
      res.status(400).json({ error: '缺少 prompt' });
      return;
    }
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-7',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await r.json();
    if (!r.ok) {
      res.status(r.status).json({ error: (data && data.error && data.error.message) || ('Anthropic ' + r.status) });
      return;
    }
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
    res.status(200).json({ text });
  } catch (e) {
    res.status(500).json({ error: String(e && e.message || e) });
  }
}
