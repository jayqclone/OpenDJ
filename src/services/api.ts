import axios from 'axios';
import { getAccessToken } from '../utils/spotifyAuth';
import { Track, Playlist, ApiError } from '../types';
import { generatePlaylistWithBackend } from './playlistApi';
import { createSpotifyPlaylist } from './spotify';

// API base URL - would come from environment in real app
const API_BASE_URL = 'https://api.example.com'; // Replace with actual API URL

// Generate playlist using backend
export const generatePlaylist = async (prompt: string): Promise<Playlist> => {
  try {
    const aiResponse = await generatePlaylistWithBackend(prompt);
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

// Refine playlist using backend
export const refinePlaylist = async (playlistId: string, refinementPrompt: string): Promise<Playlist> => {
  try {
    const aiResponse = await generatePlaylistWithBackend(refinementPrompt);
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

// Export playlist to Spotify
export const exportToSpotify = async (playlist: Playlist): Promise<string> => {
  try {
    const token = getAccessToken();
    if (!token) {
      throw { message: 'You need to log in to Spotify first.' } as ApiError;
    }

    // Create playlist on Spotify using the real API
    const playlistUrl = await createSpotifyPlaylist(
      playlist.title,
      playlist.tracks,
      playlist.description || `Generated from prompt: "${playlist.prompt}"`
    );
    
    return playlistUrl;
  } catch (error: any) {
    console.error('Failed to export to Spotify:', error);
    throw { message: error.message || 'Failed to export playlist to Spotify. Please try again.' } as ApiError;
  }
};

// Helper function to generate mock tracks for demo (keeping for backward compatibility)
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