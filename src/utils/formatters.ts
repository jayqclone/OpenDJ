// Format duration from seconds to mm:ss
export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Truncate text with ellipsis if too long
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Create Apple Music search URL
export const createAppleMusicSearchUrl = (artist: string, title: string): string => {
  const query = `${artist} ${title}`.replace(/\s+/g, '+');
  return `https://music.apple.com/search?term=${encodeURIComponent(query)}`;
};

// Format playlist title from prompt
export const formatPlaylistTitle = (prompt: string): string => {
  // Take first 30 chars or up to the first period, comma, or newline
  const shortened = prompt.split(/[.,\n]/).shift() || prompt;
  return truncateText(shortened, 30);
};

// Generate a placeholder album image if none is provided
export const getPlaceholderImage = (): string => {
  return 'https://images.pexels.com/photos/1021876/pexels-photo-1021876.jpeg?auto=compress&cs=tinysrgb&w=300';
};

// Format track for display consistency
export const formatTrackForDisplay = (track: any): any => {
  return {
    ...track,
    imageUrl: track.imageUrl || getPlaceholderImage(),
    year: track.year || 'Unknown',
    duration: track.duration || 0
  };
};