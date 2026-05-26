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

  const apiKey = 'sk_hwhqqlp8_U56c8DYZDC6LF6KVrbkhBNOk';

  try {
    const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': apiKey,
      },
      body: JSON.stringify({
        model: 'sarvam-m',
        messages: [
          {
            role: 'system',
            content: 'You are Nova, iBELL Home Appliances support assistant. Be brief and helpful. No thinking tags. Just reply directly.'
          },
          ...messages.slice(-6)
        ],
        max_tokens: 1024,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: 'AI error', detail: err });
    }

    const data = await response.json();
    let reply = data.choices?.[0]?.message?.content?.trim() || '';

    reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    reply = reply.replace(/<think>[\s\S]*/gi, '').trim();

    if (!reply) reply = "Hello! I'm Nova from iBELL support. How can I help you?";

    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
}
