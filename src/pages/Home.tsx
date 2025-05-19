import React, { useState } from 'react';
import PromptForm from '../components/PromptForm';
import PlaylistDisplay from '../components/PlaylistDisplay';
import LoadingState from '../components/LoadingState';
import useAuth from '../hooks/useAuth';
import { generatePlaylist, refinePlaylist, exportToSpotify } from '../services/api';
import { Playlist, PromptFormValues } from '../types';

const Home: React.FC = () => {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [platform, setPlatform] = useState<'spotify' | 'apple'>('spotify');
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const handlePromptSubmit = async (values: PromptFormValues) => {
    try {
      setError(null);
      setIsGenerating(true);
      setPlatform(values.platform);
      
      const newPlaylist = await generatePlaylist(values.prompt);
      setPlaylist(newPlaylist);
    } catch (err: any) {
      setError(err.message || 'Failed to generate playlist');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefinementSubmit = async (refinementPrompt: string) => {
    if (!playlist) return;
    
    try {
      setError(null);
      setIsRefining(true);
      
      const refinedPlaylist = await refinePlaylist(playlist.id, refinementPrompt);
      setPlaylist(refinedPlaylist);
    } catch (err: any) {
      setError(err.message || 'Failed to refine playlist');
    } finally {
      setIsRefining(false);
    }
  };

  const handleExportToSpotify = async (playlist: Playlist) => {
    try {
      setError(null);
      setIsExporting(true);
      
      const playlistUrl = await exportToSpotify(playlist);
      
      // Open the playlist in a new tab
      window.open(playlistUrl, '_blank');
    } catch (err: any) {
      setError(err.message || 'Failed to export to Spotify');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRegenerate = () => {
    if (!playlist) return;
    
    handlePromptSubmit({
      prompt: playlist.prompt,
      platform
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-400 to-dark-300 pb-12">
      {!playlist && !isGenerating && (
        <PromptForm 
          onSubmit={handlePromptSubmit}
          isLoading={isGenerating}
        />
      )}
      
      {isGenerating && (
        <LoadingState message="Generating your playlist" />
      )}
      
      {playlist && !isGenerating && (
        <PlaylistDisplay
          playlist={playlist}
          onExportToSpotify={handleExportToSpotify}
          onRefinementSubmit={handleRefinementSubmit}
          onRegenerate={handleRegenerate}
          isAuthenticated={isAuthenticated}
          isExporting={isExporting}
          isRefining={isRefining}
          platform={platform}
        />
      )}
      
      {error && (
        <div className="w-full max-w-2xl mx-auto mt-4 p-4 bg-red-900 bg-opacity-50 rounded-lg text-light-100">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default Home;