// PKCE Authentication Utils for Spotify OAuth flow

// Generate a random string for the code verifier
export const generateCodeVerifier = (length: number = 64): string => {
  const possibleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  
  const randomValues = new Uint8Array(length);
  window.crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    result += possibleChars.charAt(randomValues[i] % possibleChars.length);
  }
  
  return result;
};

// Hash the code verifier to create the code challenge
export const generateCodeChallenge = async (codeVerifier: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

// Store and retrieve PKCE codes from localStorage
export const storeCodeVerifier = (codeVerifier: string): void => {
  localStorage.setItem('spotify_code_verifier', codeVerifier);
};

export const getCodeVerifier = (): string | null => {
  return localStorage.getItem('spotify_code_verifier');
};

export const removeCodeVerifier = (): void => {
  localStorage.removeItem('spotify_code_verifier');
};

// Store and retrieve access token
export const storeAccessToken = (token: string, expiresIn: number): void => {
  const expiresAt = Date.now() + expiresIn * 1000;
  localStorage.setItem('spotify_access_token', token);
  localStorage.setItem('spotify_token_expires_at', expiresAt.toString());
};

export const getAccessToken = (): string | null => {
  return localStorage.getItem('spotify_access_token');
};

export const isTokenExpired = (): boolean => {
  const expiresAt = localStorage.getItem('spotify_token_expires_at');
  if (!expiresAt) return true;
  
  return Date.now() > parseInt(expiresAt, 10);
};

export const clearAuthData = (): void => {
  localStorage.removeItem('spotify_access_token');
  localStorage.removeItem('spotify_token_expires_at');
  localStorage.removeItem('spotify_code_verifier');
};

// Generate Spotify auth URL with PKCE
export const getSpotifyAuthUrl = async (clientId: string, redirectUri: string): Promise<string> => {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  
  storeCodeVerifier(codeVerifier);
  
  const scope = 'playlist-modify-private playlist-modify-public user-read-email';
  const authUrl = new URL('https://accounts.spotify.com/authorize');
  
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('code_challenge_method', 'S256');
  authUrl.searchParams.append('code_challenge', codeChallenge);
  authUrl.searchParams.append('scope', scope);
  
  return authUrl.toString();
};