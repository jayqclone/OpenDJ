import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getAccessToken, 
  isTokenExpired, 
  clearAuthData, 
  getSpotifyAuthUrl 
} from '../utils/spotifyAuth';
import { exchangeCodeForToken } from '../services/api';

// Spotify auth constants
const SPOTIFY_CLIENT_ID = 'your-client-id'; // Replace with actual client ID
const REDIRECT_URI = `${window.location.origin}/callback`;

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Check if user is authenticated
  const checkAuth = useCallback(() => {
    const token = getAccessToken();
    const isAuth = !!token && !isTokenExpired();
    setIsAuthenticated(isAuth);
    setIsLoading(false);
    return isAuth;
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Handle login with Spotify
  const login = useCallback(async () => {
    try {
      const authUrl = await getSpotifyAuthUrl(SPOTIFY_CLIENT_ID, REDIRECT_URI);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to initiate Spotify login:', error);
      setIsLoading(false);
    }
  }, []);

  // Handle logout
  const logout = useCallback(() => {
    clearAuthData();
    setIsAuthenticated(false);
    navigate('/');
  }, [navigate]);

  // Handle OAuth callback
  const handleCallback = useCallback(async (code: string, codeVerifier: string) => {
    try {
      setIsLoading(true);
      const data = await exchangeCodeForToken(code, REDIRECT_URI, codeVerifier);
      
      if (data.access_token) {
        // Store the token and update auth state
        localStorage.setItem('spotify_access_token', data.access_token);
        localStorage.setItem('spotify_token_expires_at', (Date.now() + data.expires_in * 1000).toString());
        
        setIsAuthenticated(true);
        setIsLoading(false);
        navigate('/');
        return true;
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      setIsLoading(false);
    }
    return false;
  }, [navigate]);

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
    handleCallback,
    checkAuth
  };
};

export default useAuth;