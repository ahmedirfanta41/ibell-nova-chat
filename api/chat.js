// api/chat.js — Nova chat endpoint (Vercel Serverless Function)
// Uses Sarvam AI chat completion (sarvam-30b model)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'SARVAM_API_KEY not set' });

  // Build full messages array with system prompt at the top
  const systemPrompt = {
    role: 'system',
    content: `You are Nova, a friendly and helpful customer support assistant for iBELL Home Appliances.

iBELL makes quality home appliances including fans, mixer grinders, water heaters, irons, pressure cookers, and more.

You help customers with:
- Product information and recommendations
- Service and repair requests
- Warranty registration and claims
- Order and delivery queries
- Troubleshooting tips

Keep responses short, warm, and conversational — this is a chat interface.
1-3 sentences max per reply. Be helpful and human.
If a customer needs a service request logged, collect: name, phone number, product name, and issue description.
Always respond in the same language the customer uses — Malayalam, Hindi, Tamil, or English.`
  };

  try {
    const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': apiKey,
      },
      body: JSON.stringify({
        model: 'sarvam-30b',
        messages: [systemPrompt, ...messages.slice(-10)],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Sarvam error:', response.status, err);
      return res.status(500).json({ error: 'AI error', detail: err });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim()
                  || "I'm having a moment — please try again!";

    return res.status(200).json({ reply });

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
}
