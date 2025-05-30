import axios from 'axios';
import { Track, SpotifyAuthResponse } from '../types';
import { getAccessToken, storeAccessToken, removeCodeVerifier } from '../utils/spotifyAuth';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;

// Enhanced error handling for Spotify API
class SpotifyAPIError extends Error {
  constructor(message: string, public status?: number, public error?: any) {
    super(message);
    this.name = 'SpotifyAPIError';
  }
}

// Helper function to handle API errors
const handleSpotifyError = (error: any, context: string) => {
  console.error(`[Spotify] ${context} failed:`, error);
  
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    
    switch (status) {
      case 401:
        console.error('[Spotify] Authentication failed - token may be expired');
        throw new SpotifyAPIError('Authentication failed. Please log in to Spotify again.', 401, data);
      case 403:
        console.error('[Spotify] Forbidden - insufficient permissions');
        throw new SpotifyAPIError('Insufficient permissions. Please check your Spotify app settings.', 403, data);
      case 429:
        console.error('[Spotify] Rate limit exceeded');
        throw new SpotifyAPIError('Too many requests. Please try again later.', 429, data);
      case 404:
        console.error('[Spotify] Resource not found');
        throw new SpotifyAPIError('Resource not found.', 404, data);
      default:
        throw new SpotifyAPIError(`Spotify API error: ${data?.error?.message || 'Unknown error'}`, status, data);
    }
  } else if (error.request) {
    console.error('[Spotify] Network error:', error.message);
    throw new SpotifyAPIError('Network error. Please check your connection.');
  } else {
    console.error('[Spotify] Unexpected error:', error.message);
    throw new SpotifyAPIError('An unexpected error occurred.');
  }
};

// Exchange authorization code for access token
export const exchangeCodeForToken = async (
  code: string, 
  redirectUri: string, 
  codeVerifier: string
): Promise<SpotifyAuthResponse> => {
  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', 
      new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier
      }), 
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    const data: SpotifyAuthResponse = response.data;
    
    // Store the token
    storeAccessToken(data.access_token, data.expires_in);
    
    // Clean up the code verifier
    removeCodeVerifier();
    
    console.log('[Spotify] Token exchange successful');
    return data;
  } catch (error: any) {
    handleSpotifyError(error, 'Token exchange');
    throw error; // This won't be reached due to handleSpotifyError throwing
  }
};

// Get current user's profile
export const getCurrentUser = async () => {
  const token = getAccessToken();
  if (!token) {
    throw new SpotifyAPIError('No access token available. Please log in to Spotify.');
  }

  try {
    console.log('[Spotify] Fetching current user profile');
    const response = await axios.get(`${SPOTIFY_API_BASE}/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('[Spotify] User profile retrieved successfully');
    return response.data;
  } catch (error: any) {
    handleSpotifyError(error, 'Get current user');
    throw error;
  }
};

// Search for a track on Spotify with retry logic
export const searchTrack = async (artist: string, title: string, retryCount = 0): Promise<any> => {
  const token = getAccessToken();
  if (!token) {
    throw new SpotifyAPIError('No access token available. Please log in to Spotify.');
  }

  try {
    // Try multiple search strategies for better success rate
    const searchStrategies = [
      // Strategy 1: Exact quoted search (most precise)
      () => {
        const cleanArtist = artist.replace(/[^\w\s]/gi, '').trim();
        const cleanTitle = title.replace(/[^\w\s]/gi, '').trim();
        return `artist:"${cleanArtist}" track:"${cleanTitle}"`;
      },
      // Strategy 2: Combined search without quotes (more flexible)
      () => {
        const cleanArtist = artist.replace(/[^\w\s]/gi, '').trim();
        const cleanTitle = title.replace(/[^\w\s]/gi, '').trim();
        return `${cleanArtist} ${cleanTitle}`;
      },
      // Strategy 3: Title-only search (for hard-to-find tracks)
      () => {
        const cleanTitle = title.replace(/[^\w\s]/gi, '').trim();
        return `"${cleanTitle}"`;
      },
      // Strategy 4: Artist-only search + manual title matching
      () => {
        const cleanArtist = artist.replace(/[^\w\s]/gi, '').trim();
        return `artist:"${cleanArtist}"`;
      }
    ];

    for (let strategyIndex = 0; strategyIndex < searchStrategies.length; strategyIndex++) {
      const query = searchStrategies[strategyIndex]();
      
      console.log(`[Spotify] Search strategy ${strategyIndex + 1}: ${query}`);
      
      const response = await axios.get(`${SPOTIFY_API_BASE}/search`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          q: query,
          type: 'track',
          limit: strategyIndex === 3 ? 50 : 10, // More results for artist-only search
          market: 'US'
        }
      });
      
      const tracks = response.data.tracks.items;
      
      if (tracks.length > 0) {
        // For artist-only search, manually find best title match
        if (strategyIndex === 3) {
          const titleWords = title.toLowerCase().split(/\s+/);
          const bestMatch = tracks.find((track: any) => {
            const trackTitle = track.name.toLowerCase();
            return titleWords.some(word => trackTitle.includes(word)) ||
                   trackTitle.includes(title.toLowerCase());
          });
          
          if (bestMatch) {
            console.log(`[Spotify] Found match via artist search: "${artist} - ${title}" → "${bestMatch.artists[0]?.name} - ${bestMatch.name}"`);
            return bestMatch;
          }
        } else {
          console.log(`[Spotify] Found ${tracks.length} tracks for "${artist} - ${title}" (strategy ${strategyIndex + 1})`);
          return tracks[0]; // Return best match
        }
      }
    }
    
    console.log(`[Spotify] No tracks found for "${artist} - ${title}" after trying all search strategies`);
    return null;
  } catch (error: any) {
    if (error.response?.status === 429 && retryCount < 2) {
      // Handle rate limiting with exponential backoff
      const waitTime = Math.pow(2, retryCount) * 1000;
      console.log(`[Spotify] Rate limited, retrying in ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return searchTrack(artist, title, retryCount + 1);
    }
    
    console.error(`[Spotify] Search failed for "${artist} - ${title}":`, error.message);
    return null; // Return null instead of throwing to allow playlist creation to continue
  }
};

// Search for multiple tracks and return Spotify track data
export const searchTracks = async (tracks: Track[]): Promise<Track[]> => {
  const token = getAccessToken();
  if (!token) {
    throw new SpotifyAPIError('No access token available. Please log in to Spotify.');
  }

  console.log(`[Spotify] Searching for ${tracks.length} tracks on Spotify`);
  
  const enhancedTracks = await Promise.allSettled(
    tracks.map(async (track, index) => {
      try {
        // Add small delay between requests to avoid rate limiting
        if (index > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const spotifyTrack = await searchTrack(track.artist, track.title);
        
        if (spotifyTrack) {
          console.log(`[Spotify] Found match for: ${track.artist} - ${track.title}`);
          
          // Use Spotify's metadata instead of OpenAI's for accuracy
          return {
            id: spotifyTrack.id,
            title: spotifyTrack.name, // Use Spotify's exact title
            artist: spotifyTrack.artists[0]?.name || track.artist, // Use Spotify's artist name
            album: spotifyTrack.album.name, // Use Spotify's album name
            year: parseInt(spotifyTrack.album.release_date.substring(0, 4)), // Extract year from release date
            duration: Math.round(spotifyTrack.duration_ms / 1000), // Convert ms to seconds
            imageUrl: spotifyTrack.album.images[0]?.url || track.imageUrl, // Use Spotify's album art
            spotifyUri: spotifyTrack.uri,
            // Keep OpenAI's explanation if it exists
            explanation: track.explanation
          };
        }
        
        console.log(`[Spotify] No match found for: ${track.artist} - ${track.title}`);
        return track; // Fall back to OpenAI data if no Spotify match
      } catch (error) {
        console.error(`[Spotify] Failed to enhance track: ${track.artist} - ${track.title}`, error);
        return track; // Fall back to OpenAI data on error
      }
    })
  );

  // Extract successful results
  const results = enhancedTracks
    .filter((result): result is PromiseFulfilledResult<Track> => result.status === 'fulfilled')
    .map(result => result.value);

  const foundCount = results.filter(track => track.spotifyUri).length;
  console.log(`[Spotify] Successfully found ${foundCount}/${tracks.length} tracks on Spotify`);

  return results;
};

// Create a new playlist
export const createPlaylist = async (
  name: string, 
  description: string = '', 
  isPublic: boolean = false
): Promise<any> => {
  const token = getAccessToken();
  if (!token) {
    throw new SpotifyAPIError('No access token available. Please log in to Spotify.');
  }

  try {
    console.log(`[Spotify] Creating playlist: "${name}"`);
    
    // First get the current user
    const user = await getCurrentUser();
    
    // Create the playlist with better error handling
    const response = await axios.post(
      `${SPOTIFY_API_BASE}/users/${user.id}/playlists`,
      {
        name: name.substring(0, 100), // Spotify has a 100 character limit
        description: description.substring(0, 300), // Spotify has a 300 character limit
        public: isPublic
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`[Spotify] Playlist created successfully: ${response.data.name}`);
    return response.data;
  } catch (error: any) {
    handleSpotifyError(error, 'Create playlist');
    throw error;
  }
};

// Add tracks to a playlist
export const addTracksToPlaylist = async (
  playlistId: string, 
  trackUris: string[]
): Promise<void> => {
  const token = getAccessToken();
  if (!token) {
    throw new SpotifyAPIError('No access token available. Please log in to Spotify.');
  }

  try {
    // Filter out any undefined URIs
    const validUris = trackUris.filter(uri => uri && uri.startsWith('spotify:track:'));
    
    if (validUris.length === 0) {
      console.warn('[Spotify] No valid Spotify track URIs found');
      return;
    }

    console.log(`[Spotify] Adding ${validUris.length} tracks to playlist`);

    // Spotify allows max 100 tracks per request
    const batchSize = 100;
    for (let i = 0; i < validUris.length; i += batchSize) {
      const batch = validUris.slice(i, i + batchSize);
      
      await axios.post(
        `${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`,
        {
          uris: batch
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Small delay between batches
      if (i + batchSize < validUris.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`[Spotify] Successfully added ${validUris.length} tracks to playlist`);
  } catch (error: any) {
    handleSpotifyError(error, 'Add tracks to playlist');
    throw error;
  }
};

// Main function to create a complete playlist with tracks
export const createSpotifyPlaylist = async (
  name: string,
  tracks: Track[],
  description: string = ''
): Promise<string> => {
  try {
    console.log(`[Spotify] Starting playlist creation process for "${name}"`);
    
    // First, search for Spotify tracks to get URIs
    const enhancedTracks = await searchTracks(tracks);
    
    // Create the playlist
    const playlist = await createPlaylist(name, description, false);
    
    // Get track URIs that were found on Spotify
    const trackUris = enhancedTracks
      .filter(track => track.spotifyUri)
      .map(track => track.spotifyUri!);
    
    if (trackUris.length > 0) {
      await addTracksToPlaylist(playlist.id, trackUris);
      console.log(`[Spotify] Playlist "${name}" created with ${trackUris.length} tracks`);
    } else {
      console.warn(`[Spotify] Playlist "${name}" created but no tracks were found on Spotify`);
    }
    
    return playlist.external_urls.spotify;
  } catch (error: any) {
    console.error('[Spotify] Failed to create playlist:', error);
    throw error;
  }
}; 