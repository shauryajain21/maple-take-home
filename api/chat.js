import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, contexts } = req.body;

    if (!message || !contexts || contexts.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Compose a prompt with the website content
    const contextText = contexts.map((ctx) => 
      `Title: ${ctx.title}\nURL: ${ctx.url}\nContent: ${ctx.text.slice(0, 2000)}\n`
    ).join('\n---\n');

    const prompt = `You are an intelligent assistant. Use the following website content to answer the user's question.\n\n${contextText}\n\nUser question: ${message}\n\nAnswer:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that answers questions about website content.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    const aiResponse = completion.choices[0].message?.content?.trim();

    if (!aiResponse) {
      return res.status(500).json({ error: 'No response from OpenAI' });
    }

    res.status(200).json({ response: aiResponse });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
} 