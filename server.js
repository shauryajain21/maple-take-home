import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/chat', async (req, res) => {
  try {
    const { message, contexts } = req.body;
    if (!message || !contexts || contexts.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
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
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 