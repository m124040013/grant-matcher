export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { system, user } = req.body;
  if (!system || !user) {
    return res.status(400).json({ error: '缺少必要參數' });
  }

  // 這裡改用 Gemini 的環境變數名稱，免費額度較高
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API Key 未設定，請在 Vercel 設定 GEMINI_API_KEY' });
  }

  try {
    // 呼叫 Google Gemini 1.5 Flash API (免費方案)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{ text: `${system}\n\n廠商資訊：\n${user}` }]
        }],
        generationConfig: {
          response_mime_type: "application/json", // 強制要求 JSON 格式回傳
          temperature: 0.7,
        }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: 'Gemini API 錯誤' });
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    // 解析 AI 回傳的文字並回傳給前端
    return res.status(200).json(JSON.parse(text));

  } catch (e) {
    return res.status(500).json({ error: '系統錯誤：' + e.message });
  }
}