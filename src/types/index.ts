export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  year: number;
  duration: number; // in seconds
  imageUrl?: string;
  albumArtUrl?: string;
  spotifyUri?: string;
  appleMusicUrl?: string;
  explanation?: string; // Optional explanation from OpenAI
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  tracks: Track[];
  prompt: string;
  genre?: string;
  mood?: string;
  era?: string;
}

export interface PromptFormValues {
  prompt: string;
  platform: 'spotify' | 'apple';
}

export interface RefinementFormValues {
  refinementPrompt: string;
}

export interface SpotifyAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export interface SpotifyProfile {
  id: string;
  display_name: string;
  images: {url: string}[];
  email: string;
}

export interface ApiError {
  message: string;
  status?: number;
}