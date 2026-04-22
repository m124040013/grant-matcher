export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { system, user } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API Key 未設定，請檢查 Vercel 環境變數' });
  }

  try {
    // 改用 v1 穩定版路徑，這能解決 "not found for API version" 的問題
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${system}\n\n廠商需求：\n${user}` }]
        }],
        generationConfig: {
          response_mime_type: "application/json",
          temperature: 0.7,
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const msg = data.error?.message || `狀態碼 ${response.status}`;
      return res.status(response.status).json({ error: `Google API 拒絕請求: ${msg}` });
    }

    // 取得 AI 回傳內容
    const text = data.candidates[0].content.parts[0].text;
    
    // 清理可能包含在內的 Markdown 標籤
    const cleanText = text.replace(/```json|```/g, '').trim();
    
    return res.status(200).json(JSON.parse(cleanText));

  } catch (e) {
    return res.status(500).json({ error: '系統錯誤：' + e.message });
  }
}
