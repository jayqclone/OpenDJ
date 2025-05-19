import React, { useState } from 'react';
import TrackItem from './TrackItem';
import RefinementForm from './RefinementForm';
import { ExternalLink, Copy, Share2, RefreshCw } from 'lucide-react';
import { Playlist } from '../types';
import { createAppleMusicSearchUrl } from '../utils/formatters';
import useAuth from '../hooks/useAuth';

interface PlaylistDisplayProps {
  playlist: Playlist;
  onExportToSpotify: (playlist: Playlist) => Promise<void>;
  onRefinementSubmit: (refinementPrompt: string) => Promise<void>;
  onRegenerate: () => void;
  isExporting: boolean;
  isRefining: boolean;
  platform: 'spotify' | 'apple';
}

const PlaylistDisplay: React.FC<PlaylistDisplayProps> = ({
  playlist,
  onExportToSpotify,
  onRefinementSubmit,
  onRegenerate,
  isExporting,
  isRefining,
  platform
}) => {
  const [copied, setCopied] = useState(false);
  const { isAuthenticated, login } = useAuth();

  const handleCopyToClipboard = () => {
    const playlistText = `Playlist: ${playlist.title}\n\n${
      playlist.tracks.map((track, i) => 
        `${i + 1}. ${track.title} - ${track.artist} | ${track.album} (${track.year})`
      ).join('\n')
    }`;
    
    navigator.clipboard.writeText(playlistText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleOpenAppleMusic = () => {
    if (playlist.tracks.length > 0) {
      const track = playlist.tracks[0];
      window.open(createAppleMusicSearchUrl(track.artist, track.title), '_blank');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">{playlist.title}</h2>
        <p className="text-light-200 text-sm mb-4">Based on prompt: "{playlist.prompt}"</p>
        
        <div className="flex flex-wrap gap-3 mb-6">
          {platform === 'spotify' && !isAuthenticated ? (
            <button
              onClick={login}
              className="btn btn-primary flex items-center gap-2"
            >
              Login to Spotify
            </button>
          ) : (
            <button
              onClick={() => platform === 'spotify' ? onExportToSpotify(playlist) : handleOpenAppleMusic()}
              disabled={platform === 'spotify' && !isAuthenticated || isExporting}
              className={`btn ${platform === 'spotify' ? 'btn-primary' : 'btn-apple'} flex items-center gap-2`}
            >
              {isExporting ? (
                <>
                  <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  Exporting
                </>
              ) : (
                <>
                  <ExternalLink size={16} />
                  {platform === 'spotify' ? 'Create on Spotify' : 'Open in Apple Music'}
                </>
              )}
            </button>
          )}
          
          <button
            onClick={handleCopyToClipboard}
            className="btn btn-outline flex items-center gap-2"
          >
            <Copy size={16} />
            {copied ? 'Copied!' : 'Copy Playlist'}
          </button>
          
          <button
            onClick={onRegenerate}
            className="btn btn-outline flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Regenerate
          </button>
        </div>
      </div>
      
      <div className="bg-dark-300 rounded-lg overflow-hidden mb-8">
        <div className="p-4 border-b border-dark-100">
          <div className="flex items-center text-sm text-light-200 px-2">
            <div className="w-12">#</div>
            <div className="w-12"></div>
            <div className="flex-grow">TITLE</div>
            <div className="hidden md:block w-40 px-2">ALBUM</div>
            <div className="hidden md:block w-16 text-center">YEAR</div>
            <div className="w-16 text-right">DURATION</div>
          </div>
        </div>
        
        <div className="divide-y divide-dark-100">
          {playlist.tracks.map((track, index) => (
            <TrackItem key={track.id} track={track} index={index} />
          ))}
        </div>
      </div>
      
      <RefinementForm 
        onSubmit={onRefinementSubmit} 
        isLoading={isRefining}
      />
    </div>
  );
};

export default PlaylistDisplay;