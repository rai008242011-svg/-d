// Vercel Serverless Function: Groq chat proxy (Node.js)
// Keep GROQ_API_KEY in Vercel Environment Variables. Never expose it in browser code.
export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "POSTリクエストのみ対応しています。" });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return res.status(500).json({ error: "サーバーにGROQ_API_KEYが設定されていません。VercelのEnvironment Variablesを確認し、設定後に再デプロイしてください。" });
  }

  try {
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch {
        return res.status(400).json({ error: "リクエスト本文が正しいJSONではありません。" });
      }
    }

    const incoming = Array.isArray(body?.messages) ? body.messages : [];
    const safeMessages = incoming
      .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-12)
      .map(m => ({ role: m.role, content: m.content.slice(0, 6000) }));

    if (!safeMessages.length || !safeMessages.some(m => m.role === "user")) {
      return res.status(400).json({ error: "質問が見つかりません。入力してから送信してください。" });
    }

    const messages = [
      { role: "system", content: "あなたはORRERYという親切で正確な日本語AIアシスタントです。質問に直接答え、不明なことは不明と伝え、事実を捏造しないでください。" },
      ...safeMessages
    ];

    const upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        messages,
        temperature: 0.6,
        max_tokens: 1200
      })
    });

    const raw = await upstream.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch {
      return res.status(502).json({ error: `GroqからJSON以外の応答が返りました（HTTP ${upstream.status}）。` });
    }

    if (!upstream.ok) {
      const message = data?.error?.message || `Groq APIエラー（HTTP ${upstream.status}）`;
      const status = upstream.status === 429 ? 429 : (upstream.status === 401 || upstream.status === 403 ? 502 : 502);
      return res.status(status).json({ error: message });
    }

    const answer = data?.choices?.[0]?.message?.content;
    if (typeof answer !== "string" || !answer.trim()) {
      return res.status(502).json({ error: "Groqから回答を取得できませんでした。モデルIDとGroqの利用制限を確認してください。" });
    }

    return res.status(200).json({ answer: answer.trim() });
  } catch (err) {
    // Do not return secrets or raw stack traces to the browser.
    console.error("ORRERY chat proxy failed:", err?.message || err);
    return res.status(500).json({ error: "サーバー通信でエラーが発生しました。VercelのFunctionsログを確認してください。" });
  }
}
