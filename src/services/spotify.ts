import axios from 'axios';
import { Track, SpotifyAuthResponse } from '../types';
import { getAccessToken, storeAccessToken, removeCodeVerifier } from '../utils/spotifyAuth';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;

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
    
    return data;
  } catch (error: any) {
    console.error('Failed to exchange code for token:', error);
    throw new Error('Failed to complete authentication. Please try again.');
  }
};

// Get current user's profile
export const getCurrentUser = async () => {
  const token = getAccessToken();
  if (!token) throw new Error('No access token available');

  try {
    const response = await axios.get(`${SPOTIFY_API_BASE}/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error: any) {
    console.error('Failed to get current user:', error);
    throw new Error('Failed to get user profile');
  }
};

// Search for a track on Spotify
export const searchTrack = async (artist: string, title: string): Promise<any> => {
  const token = getAccessToken();
  if (!token) throw new Error('No access token available');

  try {
    const query = `artist:"${artist}" track:"${title}"`;
    const response = await axios.get(`${SPOTIFY_API_BASE}/search`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        q: query,
        type: 'track',
        limit: 1
      }
    });
    
    return response.data.tracks.items[0] || null;
  } catch (error: any) {
    console.error(`Failed to search for track: ${artist} - ${title}`, error);
    return null;
  }
};

// Search for multiple tracks and return Spotify track data
export const searchTracks = async (tracks: Track[]): Promise<Track[]> => {
  const token = getAccessToken();
  if (!token) throw new Error('No access token available');

  const enhancedTracks = await Promise.all(
    tracks.map(async (track) => {
      try {
        const spotifyTrack = await searchTrack(track.artist, track.title);
        
        if (spotifyTrack) {
          return {
            ...track,
            spotifyUri: spotifyTrack.uri,
            imageUrl: spotifyTrack.album.images[0]?.url || track.imageUrl,
            id: spotifyTrack.id
          };
        }
        
        return track;
      } catch (error) {
        console.error(`Failed to enhance track: ${track.artist} - ${track.title}`, error);
        return track;
      }
    })
  );

  return enhancedTracks;
};

// Create a new playlist
export const createPlaylist = async (
  name: string, 
  description: string = '', 
  isPublic: boolean = false
): Promise<any> => {
  const token = getAccessToken();
  if (!token) throw new Error('No access token available');

  try {
    // First get the current user
    const user = await getCurrentUser();
    
    // Create the playlist
    const response = await axios.post(
      `${SPOTIFY_API_BASE}/users/${user.id}/playlists`,
      {
        name,
        description,
        public: isPublic
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error: any) {
    console.error('Failed to create playlist:', error);
    throw new Error('Failed to create playlist on Spotify');
  }
};

// Add tracks to a playlist
export const addTracksToPlaylist = async (
  playlistId: string, 
  trackUris: string[]
): Promise<void> => {
  const token = getAccessToken();
  if (!token) throw new Error('No access token available');

  try {
    // Filter out any undefined URIs
    const validUris = trackUris.filter(uri => uri);
    
    if (validUris.length === 0) {
      throw new Error('No valid Spotify track URIs found');
    }

    await axios.post(
      `${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`,
      {
        uris: validUris
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error: any) {
    console.error('Failed to add tracks to playlist:', error);
    throw new Error('Failed to add tracks to playlist');
  }
};

// Main function to create a complete playlist with tracks
export const createSpotifyPlaylist = async (
  name: string,
  tracks: Track[],
  description: string = ''
): Promise<string> => {
  try {
    // First, search for Spotify tracks to get URIs
    const enhancedTracks = await searchTracks(tracks);
    
    // Create the playlist
    const playlist = await createPlaylist(name, description, false);
    
    // Get track URIs that were found on Spotify
    const trackUris = enhancedTracks
      .filter(track => track.spotifyUri)
      .map(track => track.spotifyUri!);
    
    // Add tracks to the playlist if any were found
    if (trackUris.length > 0) {
      await addTracksToPlaylist(playlist.id, trackUris);
    }
    
    return playlist.external_urls.spotify;
  } catch (error: any) {
    console.error('Failed to create Spotify playlist:', error);
    throw new Error('Failed to create playlist on Spotify');
  }
}; 