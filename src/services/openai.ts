import OpenAI from 'openai';
import { Track } from '../types';

// Get API key from environment variable
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
  throw new Error('OpenAI API key is missing. Please add VITE_OPENAI_API_KEY to your .env file.');
}

const openai = new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true // Note: In production, you should use a backend proxy
});

const SYSTEM_PROMPT = `You are a music expert and playlist curator. Your task is to generate a playlist based on the user's prompt.
For each song, provide:
- Title
- Artist
- Album
- Year
- Duration (in seconds)
- A brief explanation of why this song fits the prompt

Format your response as a JSON object with the following structure:
{
  "title": "Playlist title",
  "description": "Playlist description",
  "tracks": [
    {
      "title": "Song title",
      "artist": "Artist name",
      "album": "Album name",
      "year": 2023,
      "duration": 180,
      "explanation": "Why this song fits the prompt"
    }
  ]
}`;

export const generatePlaylistWithAI = async (prompt: string): Promise<{
  title: string;
  description: string;
  tracks: Track[];
}> => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const response = JSON.parse(completion.choices[0].message.content || '{}');
    
    // Transform the response into our Track type
    const tracks: Track[] = response.tracks.map((track: any, index: number) => ({
      id: `track-${index}-${Date.now()}`,
      title: track.title,
      artist: track.artist,
      album: track.album,
      year: track.year,
      duration: track.duration,
      // We'll use a placeholder image for now
      imageUrl: `https://images.pexels.com/photos/${1000 + index}/pexels-photo-${1000 + index}.jpeg?auto=compress&cs=tinysrgb&w=300`,
      // We'll add Spotify URI later when we implement the search
      spotifyUri: undefined
    }));

    return {
      title: response.title,
      description: response.description,
      tracks
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate playlist with AI. Please try again.');
  }
}; 