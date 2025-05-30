import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Ensure preflight requests are handled
app.options('*', cors());

app.use(bodyParser.json());

const SYSTEM_PROMPT = `You are a music expert and playlist curator. Your task is to generate a playlist based on the user's prompt.\nFor each song, provide:\n- Title\n- Artist\n- Album\n- Year\n- Duration (in seconds)\n- A brief explanation of why this song fits the prompt\n\nFormat your response as a JSON object with the following structure:\n{\n  "title": "Playlist title",\n  "description": "Playlist description",\n  "tracks": [\n    {\n      "title": "Song title",\n      "artist": "Artist name",\n      "album": "Album name",\n      "year": 2023,\n      "duration": 180,\n      "explanation": "Why this song fits the prompt"\n    }\n  ]\n}`;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Mock playlist generator for when OpenAI fails
const generateMockPlaylist = (prompt) => {
  const mockTracks = [
    {
      title: "Don't Stop Me Now",
      artist: "Queen",
      album: "Jazz",
      year: 1978,
      duration: 210,
      explanation: "An energetic and uplifting anthem perfect for any playlist"
    },
    {
      title: "Mr. Blue Sky",
      artist: "Electric Light Orchestra",
      album: "Out of the Blue",
      year: 1977,
      duration: 305,
      explanation: "A joyful and optimistic song that captures the essence of happiness"
    },
    {
      title: "September",
      artist: "Earth, Wind & Fire",
      album: "The Best of Earth, Wind & Fire Vol. 1",
      year: 1978,
      duration: 215,
      explanation: "A disco-funk classic that never fails to get people moving"
    },
    {
      title: "Good as Hell",
      artist: "Lizzo",
      album: "Cuz I Love You",
      year: 2019,
      duration: 220,
      explanation: "A modern empowerment anthem with infectious energy"
    },
    {
      title: "Walking on Sunshine",
      artist: "Katrina and the Waves",
      album: "Walking on Sunshine",
      year: 1985,
      duration: 238,
      explanation: "An upbeat feel-good classic that radiates positivity"
    }
  ];

  return {
    title: `Playlist for: ${prompt}`,
    description: `A curated playlist based on your request: "${prompt}"`,
    tracks: mockTracks
  };
};

app.post('/api/generate-playlist', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }
  
  try {
    console.log('[OpenAI] Generating playlist with prompt:', prompt);
    console.log('[OpenAI] API key configured:', !!process.env.OPENAI_API_KEY);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
    });
    
    console.log('[OpenAI] Request successful');
    const response = JSON.parse(completion.choices[0].message.content || '{}');
    res.json(response);
  } catch (error) {
    console.error('[OpenAI] API error:', error);
    
    // Enhanced error handling following OpenAI best practices
    if (error instanceof OpenAI.APIError) {
      console.error('[OpenAI] Request ID:', error.request_id);
      console.error('[OpenAI] Status:', error.status);
      console.error('[OpenAI] Error name:', error.name);
      
      // Handle specific error cases
      if (error.status === 401) {
        console.error('[OpenAI] Authentication failed - check API key');
      } else if (error.status === 429) {
        console.error('[OpenAI] Rate limit exceeded or quota reached');
      } else if (error.status === 500) {
        console.error('[OpenAI] Server error');
      }
    }
    
    // If OpenAI fails (quota exceeded, etc.), fall back to mock data
    console.log('[Fallback] Using mock playlist data due to OpenAI error');
    const mockResponse = generateMockPlaylist(prompt);
    res.json(mockResponse);
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  console.log(`OpenAI API key configured: ${!!process.env.OPENAI_API_KEY}`);
}); 