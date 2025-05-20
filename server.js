import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5175',
    'http://127.0.0.1:5175'
  ],
  credentials: true
}));
app.use(bodyParser.json());

const SYSTEM_PROMPT = `You are a music expert and playlist curator. Your task is to generate a playlist based on the user's prompt.\nFor each song, provide:\n- Title\n- Artist\n- Album\n- Year\n- Duration (in seconds)\n- A brief explanation of why this song fits the prompt\n\nFormat your response as a JSON object with the following structure:\n{\n  "title": "Playlist title",\n  "description": "Playlist description",\n  "tracks": [\n    {\n      "title": "Song title",\n      "artist": "Artist name",\n      "album": "Album name",\n      "year": 2023,\n      "duration": 180,\n      "explanation": "Why this song fits the prompt"\n    }\n  ]\n}`;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/generate-playlist', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    });
    const response = JSON.parse(completion.choices[0].message.content || '{}');
    res.json(response);
  } catch (error) {
    console.error('[OpenAI] API error:', error);
    if (error?.response) {
      res.status(error.response.status).json({ error: error.response.data });
    } else {
      res.status(500).json({ error: error.message || 'Unknown error' });
    }
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
}); 