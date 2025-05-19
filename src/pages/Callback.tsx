import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { getCodeVerifier } from '../utils/spotifyAuth';
import LoadingState from '../components/LoadingState';

const Callback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const { handleCallback } = useAuth();
  
  useEffect(() => {
    const processAuth = async () => {
      // Parse the URL for the authorization code
      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      const error = params.get('error');
      
      if (error) {
        setError(`Authentication failed: ${error}`);
        return;
      }
      
      if (!code) {
        setError('No authorization code received');
        return;
      }
      
      // Get the code verifier from storage
      const codeVerifier = getCodeVerifier();
      
      if (!codeVerifier) {
        setError('Authentication state lost. Please try again.');
        return;
      }
      
      // Exchange the code for a token
      try {
        await handleCallback(code, codeVerifier);
      } catch (err) {
        console.error('Error handling callback:', err);
        setError('Failed to complete authentication. Please try again.');
      }
    };
    
    processAuth();
  }, [location, handleCallback]);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-400 to-dark-300 flex items-center justify-center">
      {error ? (
        <div className="w-full max-w-md p-6 bg-dark-300 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-red-400">Authentication Error</h2>
          <p className="text-light-200 mb-6">{error}</p>
          <a 
            href="/"
            className="btn btn-primary inline-block"
          >
            Go Back Home
          </a>
        </div>
      ) : (
        <LoadingState message="Logging you in..." />
      )}
    </div>
  );
};

export default Callback;