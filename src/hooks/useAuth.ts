import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getAccessToken, 
  isTokenExpired, 
  clearAuthData, 
  getSpotifyAuthUrl 
} from '../utils/spotifyAuth';
import { exchangeCodeForToken } from '../services/spotify';

// Spotify auth constants
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
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
    if (!SPOTIFY_CLIENT_ID) {
      console.error('Spotify Client ID not configured');
      setIsLoading(false);
      return;
    }

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