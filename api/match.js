export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { system, user } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API Key 未設定' });
  }

  try {
    // 使用最穩定的 v1beta 完整路徑
    const baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
    const url = `${baseUrl}?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${system}\n\n廠商資訊與需求：\n${user}` }]
        }],
        generationConfig: {
          // 如果 Google 不支援 json 模式，這裡會自動降級回純文字
          response_mime_type: "application/json",
          temperature: 0.7,
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // 這裡會抓出 Google 真正的錯誤原因
      const msg = data.error?.message || `狀態碼 ${response.status}`;
      return res.status(response.status).json({ error: `Google API 拒絕請求: ${msg}` });
    }

    // 解析回傳內容
    let text = data.candidates[0].content.parts[0].text;
    
    // 預防萬一：有些模型會回傳帶有 ```json 的字串，我們幫它清理掉
    const cleanText = text.replace(/```json|```/g, '').trim();
    
    return res.status(200).json(JSON.parse(cleanText));

  } catch (e) {
    return res.status(500).json({ error: '系統錯誤：' + e.message });
  }
}
