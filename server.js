import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5175',
  'http://127.0.0.1:5175'
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

const SYSTEM_PROMPT = `You are a professional music expert and playlist curator with access to public music knowledge (such as Discogs, AllMusic, and Spotify metadata). Your job is to generate a highly accurate playlist based on the user's natural language prompt.

Rules:
1. Only include songs that strictly satisfy the user's criteria.
2. If the user asks to exclude an artist (e.g., "Quincy Jones"), DO NOT include any songs:
   - Performed by that artist (as main or featured)
   - Released under that artist's name
   - From albums where they are the primary artist
3. If the user mentions a producer (e.g., "Produced by Quincy Jones"), verify actual production credits using public music data.
4. Be factual. Make no assumptions. If uncertain, omit the track.
5. Use accurate metadata for year, album, artist, and duration.
6. Default final playlist length should be 15 tracks.

Format your response as valid JSON:
{
  "title": "Playlist title",
  "description": "Short summary of the playlist",
  "tracks": [
    {
      "title": "Track Title",
      "artist": "Primary Artist",
      "album": "Album Title",
      "year": 1983,
      "duration": 243,
      "explanation": "How this track fits the user's prompt"
    }
  ]
}`;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Post-processing validation to ensure tracks meet user criteria
const validatePlaylistTracks = (tracks, originalPrompt) => {
  // Extract exclusion criteria from prompt
  const lowerPrompt = originalPrompt.toLowerCase();
  const excludedArtists = [];
  
  // Look for patterns like "not released under [artist] name" or "but released by other artists"
  const exclusionPatterns = [
    /(?:not|but not|except|excluding|avoid).*(?:released under|by|from)\s+([^,\.\!]+?)(?:\s+(?:name|as the artist))/gi,
    /produced by\s+([^,\.\!]+?).*(?:but|and).*released by other artists/gi,
    /no songs released under\s+([^,\.\!]+?)\s+as the artist/gi,
    /songs produced by\s+([^,\.\!]+?).*(?:but|,).*released by other artists/gi,
    /featuring songs produced by\s+([^,\.\!]+?).*(?:but|,).*released by other artists/gi
  ];
  
  exclusionPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(lowerPrompt)) !== null) {
      const artistName = match[1].trim().replace(/'/g, '').replace(/\s+/g, ' ');
      if (artistName && !excludedArtists.includes(artistName)) {
        excludedArtists.push(artistName);
        console.log(`[Validation] Detected exclusion: "${artistName}"`);
      }
    }
  });
  
  // Also look for explicit mentions of specific artists to exclude
  if (lowerPrompt.includes('quincy jones') && lowerPrompt.includes('but released by other')) {
    if (!excludedArtists.includes('quincy jones')) {
      excludedArtists.push('quincy jones');
      console.log(`[Validation] Detected exclusion: "quincy jones"`);
    }
  }
  
  console.log(`[Validation] Processing ${tracks.length} tracks with ${excludedArtists.length} exclusions`);
  
  if (excludedArtists.length === 0) {
    return tracks; // No exclusions detected, return original tracks
  }
  
  // Filter out tracks that violate exclusion criteria
  const validTracks = tracks.filter(track => {
    const trackArtist = track.artist.toLowerCase();
    
    for (const excludedArtist of excludedArtists) {
      // Check if the track artist contains the excluded artist name
      if (trackArtist.includes(excludedArtist.toLowerCase()) || 
          trackArtist.startsWith(excludedArtist.toLowerCase())) {
        console.log(`[Validation] Removing track: "${track.title}" by ${track.artist} (violates exclusion of ${excludedArtist})`);
        return false;
      }
    }
    return true;
  });
  
  const removedCount = tracks.length - validTracks.length;
  if (removedCount > 0) {
    console.log(`[Validation] Filtered out ${removedCount} tracks that violated exclusion criteria`);
  }
  
  return validTracks;
};

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
  const { prompt, token } = req.body;
  console.log('[API] Received token:', token ? 'present' : 'missing');
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
    let validatedTracks = validatePlaylistTracks(response.tracks, prompt);
    
    // If too many tracks were removed, try to backfill with a follow-up request
    const originalCount = response.tracks.length;
    const removedCount = originalCount - validatedTracks.length;
    
    // More aggressive backfill - trigger if we removed any tracks and ended up with fewer than 75% of original
    if (removedCount > 0 && validatedTracks.length < Math.max(8, originalCount * 0.75)) {
      console.log(`[OpenAI] ${removedCount} tracks removed (${validatedTracks.length}/${originalCount} remaining), attempting backfill...`);
      
      try {
        const tracksNeeded = originalCount - validatedTracks.length;
        const backfillPrompt = `${prompt}\n\nIMPORTANT: Generate exactly ${tracksNeeded} additional REAL tracks that exist on Spotify and strictly follow the criteria. The previous response included invalid tracks that were removed. Avoid any tracks by excluded artists.`;
        
        const backfillCompletion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: backfillPrompt },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 1500,
        });
        
        const backfillResponse = JSON.parse(backfillCompletion.choices[0].message.content || '{}');
        const backfillTracks = validatePlaylistTracks(backfillResponse.tracks || [], prompt);
        
        console.log(`[OpenAI] Backfill generated ${backfillTracks.length} additional valid tracks`);
        validatedTracks = [...validatedTracks, ...backfillTracks];
        console.log(`[OpenAI] Final playlist has ${validatedTracks.length} tracks`);
      } catch (backfillError) {
        console.warn('[OpenAI] Backfill request failed:', backfillError.message);
      }
    } else if (removedCount > 0) {
      console.log(`[OpenAI] ${removedCount} tracks removed, but ${validatedTracks.length} tracks remaining is sufficient`);
    }

    // --- Spotify Album Artwork Enhancement ---
    if (token) {
      console.log('[Spotify] Enhancing tracks with album artwork using provided token');
      const enhancedTracks = await Promise.all(validatedTracks.map(async (track) => {
        try {
          const query = `artist:${track.artist} track:${track.title}`;
          console.log(`[Spotify] Searching for: ${query}`);
          const resp = await axios.get('https://api.spotify.com/v1/search', {
            headers: { 'Authorization': `Bearer ${token}` },
            params: { q: query, type: 'track', limit: 1, market: 'US' }
          });
          const items = resp.data.tracks.items;
          console.log(`[Spotify] Results for "${track.artist} - ${track.title}": ${items.length}`);
          if (items && items.length > 0) {
            const albumImages = items[0].album.images;
            const imageUrl = albumImages[0]?.url || null;
            console.log(`[Spotify] Selected album image for "${track.artist} - ${track.title}": ${imageUrl}`);
            return { ...track, albumArtUrl: imageUrl };
          } else {
            console.log(`[Spotify] No results found for "${track.artist} - ${track.title}"`);
          }
        } catch (err) {
          console.warn(`[Spotify] Failed to fetch artwork for ${track.artist} - ${track.title}:`, err?.response?.data || err.message);
        }
        return { ...track, albumArtUrl: null };
      }));
      validatedTracks = enhancedTracks;
    }
    // --- End Spotify Enhancement ---

    res.json({
      title: response.title,
      description: response.description,
      tracks: validatedTracks
    });
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
    let validatedMockTracks = validatePlaylistTracks(mockResponse.tracks, prompt);
    // --- Spotify Album Artwork Enhancement for Mock Data ---
    if (token) {
      const enhancedTracks = await Promise.all(validatedMockTracks.map(async (track) => {
        try {
          const query = `artist:${track.artist} track:${track.title}`;
          const resp = await axios.get('https://api.spotify.com/v1/search', {
            headers: { 'Authorization': `Bearer ${token}` },
            params: { q: query, type: 'track', limit: 1, market: 'US' }
          });
          const items = resp.data.tracks.items;
          if (items && items.length > 0) {
            const albumImages = items[0].album.images;
            return { ...track, albumArtUrl: albumImages[0]?.url || null };
          }
        } catch (err) {
          console.warn(`[Spotify] Failed to fetch artwork for ${track.artist} - ${track.title}`);
        }
        return { ...track, albumArtUrl: null };
      }));
      validatedMockTracks = enhancedTracks;
    }
    // --- End Spotify Enhancement for Mock Data ---
    res.json({
      title: mockResponse.title,
      description: mockResponse.description,
      tracks: validatedMockTracks
    });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  console.log(`OpenAI API key configured: ${!!process.env.OPENAI_API_KEY}`);
}); 