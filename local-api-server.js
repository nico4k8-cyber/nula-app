import express from 'express';
import { Anthropic } from '@anthropic-ai/sdk';
import { getPersona } from './api/personas.js';

const app = express();
app.use(express.json());

const client = new Anthropic();

// POST /ai-chat - handle AI chat requests
app.post('/ai-chat', async (req, res) => {
  try {
    const { userMessage, history, puzzle, ageGroup } = req.body;

    // Import chat logic from api/chat.js
    const { handleAIChat } = await import('./api/chat.js');

    const response = await handleAIChat({
      userMessage,
      history,
      puzzle,
      ageGroup,
      client,
      getPersona,
    });

    res.json(response);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
