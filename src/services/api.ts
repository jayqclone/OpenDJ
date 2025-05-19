import axios from 'axios';
import { getAccessToken } from '../utils/spotifyAuth';
import { Track, Playlist, ApiError } from '../types';
import { generatePlaylistWithAI } from './openai';

// API base URL - would come from environment in real app
const API_BASE_URL = 'https://api.example.com'; // Replace with actual API URL
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;

// Generate playlist using OpenAI
export const generatePlaylist = async (prompt: string): Promise<Playlist> => {
  try {
    const aiResponse = await generatePlaylistWithAI(prompt);
    
    return {
      id: `playlist-${Date.now()}`,
      title: aiResponse.title,
      description: aiResponse.description,
      prompt,
      tracks: aiResponse.tracks,
    };
  } catch (error) {
    console.error('Failed to generate playlist:', error);
    throw { message: 'Failed to generate playlist. Please try again.' } as ApiError;
  }
};

// Refine playlist using OpenAI
export const refinePlaylist = async (playlistId: string, refinementPrompt: string): Promise<Playlist> => {
  try {
    const aiResponse = await generatePlaylistWithAI(refinementPrompt);
    
    return {
      id: `playlist-${Date.now()}`,
      title: aiResponse.title,
      description: aiResponse.description,
      prompt: refinementPrompt,
      tracks: aiResponse.tracks,
    };
  } catch (error) {
    console.error('Failed to refine playlist:', error);
    throw { message: 'Failed to refine playlist. Please try again.' } as ApiError;
  }
};

// Function to exchange auth code for token
export const exchangeCodeForToken = async (code: string, redirectUri: string, codeVerifier: string) => {
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
    
    return response.data;
  } catch (error) {
    console.error('Failed to exchange code for token:', error);
    throw { message: 'Failed to complete authentication. Please try again.' } as ApiError;
  }
};

// Export playlist to Spotify
export const exportToSpotify = async (playlist: Playlist): Promise<string> => {
  try {
    const token = getAccessToken();
    if (!token) {
      throw { message: 'You need to log in to Spotify first.' } as ApiError;
    }

    // In a real app, this would be an API call to your backend
    // const response = await axios.post(`${API_BASE_URL}/create-playlist`, {
    //   platform: 'spotify',
    //   access_token: token,
    //   name: playlist.title,
    //   tracks: playlist.tracks.map(track => track.spotifyUri),
    // });
    // return response.data.playlistUrl;
    
    // Mocked response for demo
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
    return `https://open.spotify.com/playlist/mock-id-${Date.now()}`;
  } catch (error) {
    console.error('Failed to export to Spotify:', error);
    throw { message: 'Failed to export playlist to Spotify. Please try again.' } as ApiError;
  }
};

// Helper function to generate mock tracks for demo
const generateMockTracks = (count: number): Track[] => {
  const artists = ['The Beatles', 'Taylor Swift', 'Kendrick Lamar', 'Daft Punk', 'Beyoncé', 'Radiohead', 'Billie Eilish'];
  const albums = ['Abbey Road', 'Folklore', 'To Pimp a Butterfly', 'Random Access Memories', 'Lemonade', 'OK Computer', 'Happier Than Ever'];
  const imageUrls = [
    'https://images.pexels.com/photos/1021876/pexels-photo-1021876.jpeg?auto=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/1389429/pexels-photo-1389429.jpeg?auto=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/1509534/pexels-photo-1509534.jpeg?auto=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/1337753/pexels-photo-1337753.jpeg?auto=compress&cs=tinysrgb&w=300'
  ];
  
  return Array.from({ length: count }, (_, i) => {
    const artistIndex = Math.floor(Math.random() * artists.length);
    const albumIndex = Math.floor(Math.random() * albums.length);
    const imageIndex = Math.floor(Math.random() * imageUrls.length);
    
    return {
      id: `track-${i}-${Date.now()}`,
      title: `Track ${i + 1}`,
      artist: artists[artistIndex],
      album: albums[albumIndex],
      year: 1990 + Math.floor(Math.random() * 33),
      duration: 120 + Math.floor(Math.random() * 240),
      imageUrl: imageUrls[imageIndex],
      spotifyUri: `spotify:track:mock${i}${Date.now()}`,
    };
  });
};