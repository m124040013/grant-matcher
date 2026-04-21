export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { system, user } = req.body;
  if (!system || !user) {
    return res.status(400).json({ error: '缺少必要參數' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API Key 未設定' });
  }

  try {
    // 修正後的 Gemini 1.5 Flash API 網址
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${system}\n\n使用者需求：\n${user}` }]
        }],
        generationConfig: {
          response_mime_type: "application/json",
          temperature: 0.7,
        }
      })
    });

    // 如果 Google 回傳錯誤，把具體訊息抓出來
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google API Error Details:', JSON.stringify(errorData));
      return res.status(response.status).json({ error: `Google API 錯誤 (${response.status})` });
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    return res.status(200).json(JSON.parse(text));

  } catch (e) {
    return res.status(500).json({ error: '系統錯誤：' + e.message });
  }
}
