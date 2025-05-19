import React from 'react';
import { formatDuration } from '../utils/formatters';
import { Track } from '../types';

interface TrackItemProps {
  track: Track;
  index: number;
}

const TrackItem: React.FC<TrackItemProps> = ({ track, index }) => {
  return (
    <div className="track-item group">
      <div className="flex-shrink-0 w-12 text-center text-light-200">
        {index + 1}
      </div>
      
      <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden bg-dark-200">
        <img 
          src={track.imageUrl || 'https://images.pexels.com/photos/1021876/pexels-photo-1021876.jpeg?auto=compress&cs=tinysrgb&w=300'}
          alt={`${track.album} cover`} 
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="flex-grow min-w-0">
        <div className="font-medium truncate">{track.title}</div>
        <div className="text-sm text-light-300 truncate">{track.artist}</div>
      </div>
      
      <div className="hidden md:block flex-shrink-0 min-w-0 max-w-40 px-2">
        <div className="text-sm text-light-300 truncate">{track.album}</div>
      </div>
      
      <div className="hidden md:block flex-shrink-0 w-16 text-center text-light-300 text-sm">
        {track.year}
      </div>
      
      <div className="flex-shrink-0 w-16 text-right text-light-300 text-sm">
        {formatDuration(track.duration)}
      </div>
    </div>
  );
};

export default TrackItem;