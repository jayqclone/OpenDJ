import axios from 'axios';
import { getAccessToken } from '../utils/spotifyAuth';
import { Track, Playlist, ApiError } from '../types';
import { generatePlaylistWithBackend } from './playlistApi';
import { createSpotifyPlaylist, searchTracks } from './spotify';

// API base URL - would come from environment in real app
const API_BASE_URL = 'https://api.example.com'; // Replace with actual API URL

// Generate playlist using backend
export const generatePlaylist = async (prompt: string): Promise<Playlist> => {
  try {
    const spotifyToken = getAccessToken() || undefined;
    console.log('[Frontend] Spotify token:', spotifyToken);
    const aiResponse = await generatePlaylistWithBackend(prompt, spotifyToken);
    
    // Create base playlist object
    const playlist: Playlist = {
      id: `playlist-${Date.now()}`,
      title: aiResponse.title,
      description: aiResponse.description,
      prompt,
      tracks: aiResponse.tracks.map((track: any) => ({
        ...track,
        id: track.id || `track-${Date.now()}-${Math.random()}`,
        imageUrl: track.imageUrl || 'https://images.pexels.com/photos/1021876/pexels-photo-1021876.jpeg?auto=compress&cs=tinysrgb&w=300'
      })),
    };

    // If user is authenticated with Spotify, enhance tracks and filter out hallucinations
    if (spotifyToken) {
      try {
        console.log('[Spotify] User authenticated, enhancing tracks and filtering hallucinations...');
        const enhancedTracks = await searchTracks(playlist.tracks);
        
        // Be less aggressive with filtering - only remove tracks if we're confident they're hallucinations
        // Since backend already does validation, we mainly want to catch obvious fake songs
        const validTracks: Track[] = [];
        const possibleHallucinations: Track[] = [];
        
        enhancedTracks.forEach(track => {
          if (track.spotifyUri) {
            // Track found on Spotify - definitely valid
            validTracks.push(track);
          } else {
            // Track not found - but might be real song with search issues
            possibleHallucinations.push(track);
          }
        });
        
        // Only filter out tracks if we found SOME tracks on Spotify
        // If Spotify found nothing, it's likely a search/API issue, not hallucinations
        if (validTracks.length > 0 && possibleHallucinations.length > 0) {
          const hallucinationRatio = possibleHallucinations.length / enhancedTracks.length;
          
          if (hallucinationRatio > 0.6) {
            // If more than 60% not found, likely Spotify API issue - keep all tracks
            console.warn('[Spotify] High percentage of tracks not found - likely API issue, keeping all tracks');
            playlist.tracks = enhancedTracks;
          } else {
            // Normal case - some tracks found, some not
            console.warn(`[Validation] Found ${possibleHallucinations.length} tracks not on Spotify:`, 
              possibleHallucinations.map(t => `"${t.title}" by ${t.artist}`));
            playlist.tracks = validTracks;
            
            // Request replacements if we lost too many tracks
            if (validTracks.length < Math.max(6, playlist.tracks.length * 0.7)) {
              console.log('[OpenAI] Too many tracks not found on Spotify, requesting replacements...');
              
              try {
                const replacementPrompt = `${prompt}\n\nIMPORTANT: Please generate ${possibleHallucinations.length} additional REAL tracks that exist on Spotify. Avoid fictional or made-up songs. Only include songs that actually exist and can be found on music platforms.`;
                
                const replacementResponse = await generatePlaylistWithBackend(replacementPrompt, spotifyToken);
                const replacementTracks = await searchTracks(replacementResponse.tracks.map((track: any) => ({
                  ...track,
                  id: track.id || `track-${Date.now()}-${Math.random()}`
                })));
                
                // Only add replacements that Spotify can find
                const validReplacements = replacementTracks.filter(track => track.spotifyUri);
                validTracks.push(...validReplacements);
                
                console.log(`[OpenAI] Added ${validReplacements.length} verified replacement tracks`);
                playlist.tracks = validTracks;
              } catch (error) {
                console.warn('[OpenAI] Failed to get replacement tracks:', error);
              }
            }
          }
        } else if (validTracks.length === 0) {
          // No tracks found on Spotify - definitely a search/API issue
          console.warn('[Spotify] No tracks found on Spotify - likely API issue, keeping original tracks');
          playlist.tracks = enhancedTracks;
        } else {
          // All tracks found on Spotify - perfect!
          playlist.tracks = validTracks;
        }
        
        console.log(`[Spotify] Finalized playlist with ${playlist.tracks.length} tracks`);
        
      } catch (error) {
        console.warn('[Spotify] Failed to enhance tracks with Spotify data:', error);
        // Continue with original tracks if Spotify enhancement fails
      }
    } else {
      console.log('[Spotify] User not authenticated, using default album artwork');
    }

    return playlist;
  } catch (error) {
    console.error('Failed to generate playlist:', error);
    throw { message: 'Failed to generate playlist. Please try again.' } as ApiError;
  }
};

// Refine playlist using backend
export const refinePlaylist = async (playlistId: string, refinementPrompt: string): Promise<Playlist> => {
  try {
    const spotifyToken = getAccessToken() || undefined;
    console.log('[Frontend] Spotify token:', spotifyToken);
    const aiResponse = await generatePlaylistWithBackend(refinementPrompt, spotifyToken);
    
    // Create base playlist object
    const playlist: Playlist = {
      id: `playlist-${Date.now()}`,
      title: aiResponse.title,
      description: aiResponse.description,
      prompt: refinementPrompt,
      tracks: aiResponse.tracks.map((track: any) => ({
        ...track,
        id: track.id || `track-${Date.now()}-${Math.random()}`,
        imageUrl: track.imageUrl || 'https://images.pexels.com/photos/1021876/pexels-photo-1021876.jpeg?auto=compress&cs=tinysrgb&w=300'
      })),
    };

    // If user is authenticated with Spotify, enhance tracks and filter out hallucinations
    if (spotifyToken) {
      try {
        console.log('[Spotify] User authenticated, enhancing refined tracks and filtering hallucinations...');
        const enhancedTracks = await searchTracks(playlist.tracks);
        
        // Filter out tracks that Spotify couldn't find (likely hallucinations)
        const validTracks = enhancedTracks.filter(track => track.spotifyUri);
        const hallucinatedTracks = enhancedTracks.filter(track => !track.spotifyUri);
        
        if (hallucinatedTracks.length > 0) {
          console.warn(`[Validation] Found ${hallucinatedTracks.length} likely hallucinated tracks in refined playlist:`, 
            hallucinatedTracks.map(t => `"${t.title}" by ${t.artist}`));
          
          // If we lost too many tracks, request replacements
          if (validTracks.length < Math.max(6, playlist.tracks.length * 0.6)) {
            console.log('[OpenAI] Too many refined tracks were hallucinated, requesting replacements...');
            
            try {
              const replacementPrompt = `${refinementPrompt}\n\nIMPORTANT: Please generate ${hallucinatedTracks.length} additional REAL tracks that exist on Spotify. Avoid fictional or made-up songs. Only include songs that actually exist and can be found on music platforms.`;
              
              const replacementResponse = await generatePlaylistWithBackend(replacementPrompt, spotifyToken);
              const replacementTracks = await searchTracks(replacementResponse.tracks.map((track: any) => ({
                ...track,
                id: track.id || `track-${Date.now()}-${Math.random()}`
              })));
              
              // Only add replacements that Spotify can find
              const validReplacements = replacementTracks.filter(track => track.spotifyUri);
              validTracks.push(...validReplacements);
              
              console.log(`[OpenAI] Added ${validReplacements.length} verified replacement tracks to refined playlist`);
            } catch (error) {
              console.warn('[OpenAI] Failed to get replacement tracks for refined playlist:', error);
            }
          }
        }
        
        playlist.tracks = validTracks;
        console.log(`[Spotify] Finalized refined playlist with ${validTracks.length} verified tracks`);
        
      } catch (error) {
        console.warn('[Spotify] Failed to enhance refined tracks with Spotify data:', error);
        // Continue with original tracks if Spotify enhancement fails
      }
    } else {
      console.log('[Spotify] User not authenticated, using default album artwork for refined playlist');
    }

    return playlist;
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